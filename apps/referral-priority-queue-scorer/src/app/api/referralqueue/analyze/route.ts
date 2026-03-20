import { hasSupabaseServerAccess, referralPriorityQueueApp } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildReferralQueueInsight } from "@/services/score-referrals";

const requestSchema = z.object({
  queueText: z.string().min(140, "Provide a fuller queue dataset with the required TSV columns and at least two referral rows."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_referralqueuescorer under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_referralqueuescorer. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/referral-priority-queue-scorer/db/init_referralqueuescorer.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(requestId: string, queueText: string, sourceLabel: string | undefined, question: string | undefined, analysis: ReturnType<typeof buildReferralQueueInsight>) {
  if (!hasSupabaseServerAccess()) {
    return {
      status: "skipped",
      reason: "Supabase server credentials are not configured yet."
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(referralPriorityQueueApp.schema)
      .from("app_referralqueuescorer_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_queue_text: queueText,
        question: question ?? null,
        summary: analysis.summary,
        ranked_referrals: analysis.rankedReferrals,
        warnings: analysis.warnings,
        top_drivers: analysis.topDrivers,
        query_hits: analysis.queryHits,
        raw_analysis: analysis
      });

    if (error) {
      return {
        status: "failed",
        reason: formatPersistenceFailure(error.message)
      } as const;
    }

    return { status: "stored" } as const;
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? formatPersistenceFailure(error.message) : "Unknown persistence error"
    } as const;
  }
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(referralPriorityQueueApp.schema).from("app_referralqueuescorer_audit").insert({
      request_id: requestId,
      stage,
      payload
    });
  } catch {
    // Audit logging should never block the request.
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({
    appKey: referralPriorityQueueApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid referral queue payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = buildReferralQueueInsight(parsed.data.queueText, parsed.data.question);
    const persistence = await persistAnalysis(requestId, parsed.data.queueText, parsed.data.sourceLabel, parsed.data.question, analysis);

    await persistAudit(requestId, "scoring_completed", {
      queueCount: analysis.summary.queueCount,
      criticalCount: analysis.summary.criticalCount,
      highestScore: analysis.summary.highestScore,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Referral priority scoring failed.";

    await persistAudit(requestId, "scoring_failed", { error: message });
    logger.warn("referral priority scoring failed", { error: message });

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}

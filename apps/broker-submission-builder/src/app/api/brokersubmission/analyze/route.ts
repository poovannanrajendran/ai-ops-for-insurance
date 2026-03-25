import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { brokerSubmissionBuilderApp } from "@/lib/app-metadata";
import { analyzeBrokerSubmission } from "@/services/analyze-broker-submission";

const requestSchema = z.object({
  submissionText: z.string().min(120, "Provide a fuller broker submission note with core fields."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_brokersubmission under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_brokersubmission. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/broker-submission-builder/db/init_brokersubmission.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  submissionText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  insight: ReturnType<typeof analyzeBrokerSubmission>["insight"]
) {
  if (!hasSupabaseServerAccess()) {
    return {
      status: "skipped",
      reason: "Supabase server credentials are not configured yet."
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(brokerSubmissionBuilderApp.schema)
      .from("app_brokersubmission_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_input: submissionText,
        question: question ?? null,
        summary: insight.summary,
        raw_analysis: insight
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
    await supabase.schema(brokerSubmissionBuilderApp.schema).from("app_brokersubmission_audit").insert({
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
    appKey: brokerSubmissionBuilderApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const { missing, insight } = analyzeBrokerSubmission(parsed.data.submissionText, parsed.data.question);

    if (missing.length > 0) {
      await persistAudit(requestId, "validation_failed", { missing });
      return NextResponse.json(
        {
          error: `Missing required submission fields: ${missing.join(", ")}.`,
          missingFields: missing
        },
        { status: 400 }
      );
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.submissionText,
      parsed.data.sourceLabel,
      parsed.data.question,
      insight
    );

    await persistAudit(requestId, "analysis_completed", {
      readiness: insight.summary.readiness,
      referralCount: insight.summary.referralCount,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis: insight,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Broker submission analysis failed.";

    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("broker submission analysis failed", { error: message });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

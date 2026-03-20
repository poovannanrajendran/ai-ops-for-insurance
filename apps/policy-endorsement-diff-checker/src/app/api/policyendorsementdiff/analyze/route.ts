import { hasSupabaseServerAccess, policyEndorsementDiffApp } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzePolicyEndorsementDiff } from "@/services/analyze-policy-endorsement-diff";

const requestSchema = z.object({
  expiringText: z.string().min(80, "Provide fuller expiring wording (minimum 80 characters)."),
  renewalText: z.string().min(80, "Provide fuller renewal wording (minimum 80 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_policyendorsementdiff under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_policyendorsementdiff. Grant schema/table/sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/policy-endorsement-diff-checker/db/init_policyendorsementdiff.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  expiringText: string,
  renewalText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof analyzePolicyEndorsementDiff>
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
      .schema(policyEndorsementDiffApp.schema)
      .from("app_policyendorsementdiff_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        expiring_text: expiringText,
        renewal_text: renewalText,
        question: question ?? null,
        summary: analysis.summary,
        executive_brief: analysis.executiveBrief,
        clause_diffs: analysis.clauseDiffs,
        warnings: analysis.warnings,
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
    await supabase.schema(policyEndorsementDiffApp.schema).from("app_policyendorsementdiff_audit").insert({
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
    appKey: policyEndorsementDiffApp.shortName,
    requestId
  });

  logger.info("policy endorsement diff analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid endorsement diff payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = analyzePolicyEndorsementDiff(parsed.data.expiringText, parsed.data.renewalText, parsed.data.question);
    const persistence = await persistAnalysis(
      requestId,
      parsed.data.expiringText,
      parsed.data.renewalText,
      parsed.data.question,
      parsed.data.sourceLabel,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      materialChanges: analysis.summary.materialChangeCount,
      highSeverity: analysis.summary.highSeverityCount,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Policy endorsement diff analysis failed.";

    await persistAudit(requestId, "analysis_failed", {
      error: message
    });

    logger.warn("policy endorsement diff analysis failed", {
      error: message
    });

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}

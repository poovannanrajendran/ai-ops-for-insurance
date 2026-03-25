import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeWordingRiskDiff } from "@/services/analyze-wording-risk-diff";

const appConfig = {
  shortName: "wordingriskdiff",
  schema: "app_wordingriskdiff"
} as const;

const requestSchema = z.object({
  baselineText: z.string().min(120, "Provide fuller baseline wording (minimum 120 characters)."),
  revisedText: z.string().min(120, "Provide fuller revised wording (minimum 120 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_wordingriskdiff under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_wordingriskdiff. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/wording-risk-diff-checker/db/init_wordingriskdiff.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  baselineText: string,
  revisedText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeWordingRiskDiff>
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
      .schema(appConfig.schema)
      .from("app_wordingriskdiff_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        baseline_text: baselineText,
        revised_text: revisedText,
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
    await supabase.schema(appConfig.schema).from("app_wordingriskdiff_audit").insert({
      request_id: requestId,
      stage,
      payload
    });
  } catch {
    // Audit logging is intentionally non-blocking.
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({
    appKey: appConfig.shortName,
    requestId
  });

  logger.info("wording risk diff analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    logger.warn("wording risk diff validation failed", { issues: parsed.error.issues });
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid wording risk diff payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = analyzeWordingRiskDiff(parsed.data.baselineText, parsed.data.revisedText, parsed.data.question);
    const persistence = await persistAnalysis(
      requestId,
      parsed.data.baselineText,
      parsed.data.revisedText,
      parsed.data.sourceLabel,
      parsed.data.question,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      materialChanges: analysis.summary.materialChangeCount,
      highSeverity: analysis.summary.highSeverityCount,
      persistenceStatus: persistence.status
    });

    logger.info("wording risk diff analysis completed", {
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
    const message = error instanceof Error ? error.message : "Wording risk diff analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("wording risk diff analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

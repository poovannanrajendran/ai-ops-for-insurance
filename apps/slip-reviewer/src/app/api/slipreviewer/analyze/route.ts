import { hasSupabaseServerAccess, slipReviewerApp } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { buildSlipReviewInsight } from "@/services/analyze-slip";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  slipText: z
    .string()
    .min(80, "Provide slip text with enough detail for extraction and review."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_slipreviewer under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_slipreviewer. Grant schema/table/sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/slip-reviewer/db/init_slipreviewer.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  slipText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof buildSlipReviewInsight>
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
      .schema(slipReviewerApp.schema)
      .from("app_slipreviewer_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_slip_text: slipText,
        question: question ?? null,
        field_coverage: analysis.summary.fieldCoverage,
        matched_fields: analysis.summary.matchedFields,
        missing_fields: analysis.summary.missingFields,
        gate_passed: analysis.summary.gatePassed,
        missing_required_fields: analysis.summary.missingRequiredFields,
        structured_data: analysis.structuredData,
        field_matches: analysis.fieldMatches,
        unusual_clauses: analysis.unusualClauses,
        coverage_gaps: analysis.coverageGaps,
        commentary: analysis.commentary,
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
      reason:
        error instanceof Error
          ? formatPersistenceFailure(error.message)
          : "Unknown persistence error"
    } as const;
  }
}

async function persistAudit(
  requestId: string,
  stage: string,
  payload: Record<string, unknown>
) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase
      .schema(slipReviewerApp.schema)
      .from("app_slipreviewer_audit")
      .insert({
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
    appKey: slipReviewerApp.shortName,
    requestId
  });

  logger.info("slip review analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    logger.warn("slip review analysis rejected", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid slip review payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = buildSlipReviewInsight(parsed.data.slipText, parsed.data.question);

    logger.info("slip review analysis completed", {
      fieldCoverage: analysis.summary.fieldCoverage,
      gatePassed: analysis.summary.gatePassed,
      unusualClauseCount: analysis.unusualClauses.length,
      coverageGapCount: analysis.coverageGaps.length
    });

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.slipText,
      parsed.data.question,
      parsed.data.sourceLabel,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      fieldCoverage: analysis.summary.fieldCoverage,
      gatePassed: analysis.summary.gatePassed,
      unusualClauseCount: analysis.unusualClauses.length,
      coverageGapCount: analysis.coverageGaps.length,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slip review analysis failed.";
    await persistAudit(requestId, "analysis_failed", {
      error: message
    });

    logger.warn("slip review analysis failed", {
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

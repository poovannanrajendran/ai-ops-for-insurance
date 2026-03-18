import { classOfBusinessApp, hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { buildClassOfBusinessInsight } from "@/services/analyze-class-of-business";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  riskText: z
    .string()
    .min(80, "Provide a fuller risk description (minimum 80 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_classofbusiness under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_classofbusiness. Grant schema/table/sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/class-of-business-classifier/db/init_classofbusiness.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  riskText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof buildClassOfBusinessInsight>
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
      .schema(classOfBusinessApp.schema)
      .from("app_classofbusiness_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_risk_text: riskText,
        question: question ?? null,
        top_label: analysis.summary.topLabel,
        top_confidence: analysis.summary.topConfidence,
        confidence_band: analysis.summary.confidenceBand,
        ambiguous: analysis.summary.ambiguous,
        warnings: analysis.warnings,
        candidates: analysis.candidates,
        keyword_signals: analysis.keywordSignals,
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

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase
      .schema(classOfBusinessApp.schema)
      .from("app_classofbusiness_audit")
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
    appKey: classOfBusinessApp.shortName,
    requestId
  });

  logger.info("class-of-business analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    logger.warn("class-of-business analysis rejected", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid class-of-business payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = buildClassOfBusinessInsight(parsed.data.riskText, parsed.data.question);

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.riskText,
      parsed.data.question,
      parsed.data.sourceLabel,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      topLabel: analysis.summary.topLabel,
      topConfidence: analysis.summary.topConfidence,
      confidenceBand: analysis.summary.confidenceBand,
      warnings: analysis.warnings.length,
      persistenceStatus: persistence.status
    });

    logger.info("class-of-business analysis completed", {
      topLabel: analysis.summary.topLabel,
      topConfidence: analysis.summary.topConfidence,
      confidenceBand: analysis.summary.confidenceBand,
      warnings: analysis.warnings.length,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Class-of-business analysis failed.";

    await persistAudit(requestId, "analysis_failed", {
      error: message
    });

    logger.warn("class-of-business analysis failed", {
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

import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { aiReadinessScorerApp } from "@/lib/app-config";
import { analyzeAiReadiness } from "@/services/analyze-ai-readiness";

const requestSchema = z.object({
  sourceLabel: z.string().max(160).optional(),
  assessmentText: z.string().min(100, "Provide a fuller AI readiness assessment payload."),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_aireadiness under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_aireadiness. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/insurance-ai-readiness-scorer/db/init_aireadiness.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAnalysis(requestId: string, persisted: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return {
      status: "skipped",
      reason: "Supabase server credentials are not configured yet."
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.schema(aiReadinessScorerApp.schema).from("app_aireadiness_runs").insert({
      request_id: requestId,
      source_label: persisted.source_label,
      assessment_text: persisted.assessment_text,
      readiness_score: persisted.readiness_score,
      readiness_band: persisted.readiness_band,
      status: persisted.status,
      completeness_pct: persisted.completeness_pct,
      confidence: persisted.confidence,
      strengths: persisted.strengths,
      blockers: persisted.blockers,
      ninety_day_plan: persisted.ninety_day_plan,
      prompt_hits: persisted.prompt_hits,
      warnings: persisted.warnings,
      raw_analysis: persisted.raw_analysis
    });

    if (error) {
      return { status: "failed", reason: formatPersistenceFailure(error.message) } as const;
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
  if (!hasSupabaseServerAccess()) return;

  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(aiReadinessScorerApp.schema).from("app_aireadiness_audit").insert({
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
    appKey: aiReadinessScorerApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const { analysis, persisted } = analyzeAiReadiness({
      sourceLabel: parsed.data.sourceLabel,
      assessmentText: parsed.data.assessmentText,
      prompt: parsed.data.question
    });

    if (analysis.summary.completenessPct < 50) {
      await persistAudit(requestId, "required_field_gate_failed", { completenessPct: analysis.summary.completenessPct });
      return NextResponse.json({ error: "Required-field gate failed: readiness payload is incomplete." }, { status: 400 });
    }

    const persistence = await persistAnalysis(requestId, persisted);
    await persistAudit(requestId, "analysis_completed", {
      readinessScore: analysis.summary.readinessScore,
      readinessBand: analysis.summary.readinessBand,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI readiness analysis failed.";
    logger.warn("ai readiness analysis failed", { error: message });
    await persistAudit(requestId, "analysis_failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


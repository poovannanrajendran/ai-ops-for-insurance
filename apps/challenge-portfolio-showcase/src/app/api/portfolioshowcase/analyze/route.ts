import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { challengePortfolioShowcaseApp } from "@/lib/app-config";
import { analyzePortfolioShowcase } from "@/services/analyze-portfolio-showcase";

const requestSchema = z.object({
  sourceLabel: z.string().max(160).optional(),
  showcaseText: z.string().min(120, "Provide a fuller portfolio showcase payload."),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_portfolioshowcase under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_portfolioshowcase. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/challenge-portfolio-showcase/db/init_portfolioshowcase.sql in your target project, then retry.";
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
    const { error } = await supabase.schema(challengePortfolioShowcaseApp.schema).from("app_portfolioshowcase_runs").insert({
      request_id: requestId,
      source_label: persisted.source_label,
      showcase_text: persisted.showcase_text,
      showcase_score: persisted.showcase_score,
      showcase_band: persisted.showcase_band,
      status: persisted.status,
      completeness_pct: persisted.completeness_pct,
      confidence: persisted.confidence,
      strengths: persisted.strengths,
      blockers: persisted.blockers,
      next_actions: persisted.next_actions,
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
    await supabase.schema(challengePortfolioShowcaseApp.schema).from("app_portfolioshowcase_audit").insert({
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
    appKey: challengePortfolioShowcaseApp.shortName,
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

    const { analysis, persisted } = analyzePortfolioShowcase({
      sourceLabel: parsed.data.sourceLabel,
      showcaseText: parsed.data.showcaseText,
      prompt: parsed.data.question
    });

    if (analysis.summary.completenessPct < 50) {
      await persistAudit(requestId, "required_field_gate_failed", { completenessPct: analysis.summary.completenessPct });
      return NextResponse.json({ error: "Required-field gate failed: showcase payload is incomplete." }, { status: 400 });
    }

    const persistence = await persistAnalysis(requestId, persisted);
    await persistAudit(requestId, "analysis_completed", {
      showcaseScore: analysis.summary.showcaseScore,
      showcaseBand: analysis.summary.showcaseBand,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challenge portfolio showcase analysis failed.";
    logger.warn("portfolio showcase analysis failed", { error: message });
    await persistAudit(requestId, "analysis_failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

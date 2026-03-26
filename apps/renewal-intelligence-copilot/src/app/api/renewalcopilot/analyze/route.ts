import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeRenewalCopilot } from "@/services/analyze-renewal-copilot";

const appConfig = {
  shortName: "renewalcopilot",
  schema: "app_renewalcopilot"
} as const;

const requestSchema = z.object({
  renewalText: z.string().min(120, "Provide fuller renewal pack text (minimum 120 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_renewalcopilot under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_renewalcopilot. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/renewal-intelligence-copilot/db/init_renewalcopilot.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) return;
  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(appConfig.schema).from("app_renewalcopilot_audit").insert({
      request_id: requestId,
      stage,
      payload
    });
  } catch {
    // Non-blocking by design.
  }
}

async function persistAnalysis(
  requestId: string,
  renewalText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeRenewalCopilot>["insight"]
) {
  if (!hasSupabaseServerAccess()) {
    return { status: "skipped", reason: "Supabase server credentials are not configured yet." } as const;
  }
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(appConfig.schema)
      .from("app_renewalcopilot_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        renewal_text: renewalText,
        question: question ?? null,
        summary: analysis.summary,
        strategy_memo: analysis.strategyMemo,
        negotiation_talking_points: analysis.negotiationTalkingPoints,
        pricing_signals: analysis.pricingSignals,
        action_plan: analysis.actionPlan,
        warnings: analysis.warnings,
        query_hits: analysis.queryHits,
        whitespace_rows: analysis.whitespaceRows,
        raw_analysis: analysis
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Analysis timeout exceeded.")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({ appKey: appConfig.shortName, requestId });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid renewal copilot payload." }, { status: 400 });
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analyzed = await withTimeout(Promise.resolve(analyzeRenewalCopilot(parsed.data.renewalText, parsed.data.question)), 3000);
    if (analyzed.missing.length > 0) {
      await persistAudit(requestId, "validation_failed", { missing: analyzed.missing });
      return NextResponse.json({ error: `Missing required renewal fields: ${analyzed.missing.join(", ")}.` }, { status: 400 });
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.renewalText,
      parsed.data.sourceLabel,
      parsed.data.question,
      analyzed.insight
    );

    await persistAudit(requestId, "analysis_completed", {
      pricingDirection: analyzed.insight.summary.pricingDirection,
      movementPct: analyzed.insight.summary.recommendedMovementPct,
      persistenceStatus: persistence.status
    });

    logger.info("renewal copilot analysis completed", {
      pricingDirection: analyzed.insight.summary.pricingDirection,
      movementPct: analyzed.insight.summary.recommendedMovementPct,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis: analyzed.insight,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Renewal copilot analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("renewal copilot analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

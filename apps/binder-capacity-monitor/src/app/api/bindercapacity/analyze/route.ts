import { binderCapacityMonitorApp, hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeBinderCapacityCsv, parseBinderCsv } from "@/services/analyze-binder-capacity";

const requestSchema = z.object({
  csvText: z.string().min(80, "Provide a fuller CSV payload with at least two binder rows."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_bindercapacity under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_bindercapacity. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/binder-capacity-monitor/db/init_bindercapacity.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  csvText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeBinderCapacityCsv>
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
      .schema(binderCapacityMonitorApp.schema)
      .from("app_bindercapacity_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_csv_text: csvText,
        question: question ?? null,
        summary: analysis.summary,
        warnings: analysis.warnings,
        class_breakdown: analysis.classBreakdown,
        territory_breakdown: analysis.territoryBreakdown,
        top_risks: analysis.topRisks,
        commentary: analysis.commentary,
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
    await supabase.schema(binderCapacityMonitorApp.schema).from("app_bindercapacity_audit").insert({
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
    appKey: binderCapacityMonitorApp.shortName,
    requestId
  });

  logger.info("binder capacity analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid binder capacity payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const parsedCsv = parseBinderCsv(parsed.data.csvText);
    if (parsedCsv.errors.length > 0) {
      await persistAudit(requestId, "validation_failed", {
        csvErrors: parsedCsv.errors
      });

      return NextResponse.json(
        {
          error: parsedCsv.errors[0]
        },
        { status: 400 }
      );
    }

    const analysis = analyzeBinderCapacityCsv(parsed.data.csvText, parsed.data.question);
    const persistence = await persistAnalysis(requestId, parsed.data.csvText, parsed.data.sourceLabel, parsed.data.question, analysis);

    await persistAudit(requestId, "analysis_completed", {
      usedPct: analysis.summary.usedPct,
      forecastUsedPct: analysis.summary.forecastUsedPct,
      breachRisk: analysis.summary.breachRisk,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Binder capacity analysis failed.";

    await persistAudit(requestId, "analysis_failed", {
      error: message
    });

    logger.warn("binder capacity analysis failed", { error: message });

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}

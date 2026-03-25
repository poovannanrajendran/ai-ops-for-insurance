import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { exposureScenarioModellerApp } from "@/lib/app-config";
import { analyzeExposureScenario } from "@/services/analyze-exposure-scenario";

const requestSchema = z.object({
  csvText: z.string().min(120, "Provide a fuller exposure CSV payload with at least three rows."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_exposurescenario under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_exposurescenario. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/exposure-scenario-modeller/db/init_exposurescenario.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  csvText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof analyzeExposureScenario>["analysis"]
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
      .schema(exposureScenarioModellerApp.schema)
      .from("app_exposurescenario_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_csv_text: csvText,
        question: question ?? null,
        summary: analysis.summary,
        required_field_gate: analysis.requiredFieldGate,
        scenarios: analysis.scenarios,
        concentration_insights: analysis.concentrationInsights,
        query_snippets: analysis.querySnippets,
        warnings: analysis.warnings,
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
        error instanceof Error ? formatPersistenceFailure(error.message) : "Unknown persistence error"
    } as const;
  }
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(exposureScenarioModellerApp.schema).from("app_exposurescenario_audit").insert({
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
    appKey: exposureScenarioModellerApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    logger.warn("exposure scenario validation failed", { issues: parsed.error.issues.length });
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

    const { analysis, validationErrors } = analyzeExposureScenario(parsed.data.csvText, parsed.data.question);

    if (validationErrors.length > 0) {
      await persistAudit(requestId, "required_field_gate_failed", {
        validationErrors,
        gate: analysis.requiredFieldGate
      });
      return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.csvText,
      parsed.data.question,
      parsed.data.sourceLabel,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      rowCount: analysis.summary.rowCount,
      stressDeltaPct: analysis.summary.stressDeltaPct,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Exposure scenario analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("exposure scenario analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

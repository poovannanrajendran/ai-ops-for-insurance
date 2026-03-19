import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { exposureHeatmapApp, hasSupabaseServerAccess } from "@ai-ops/config";
import { analyzeExposureCsv, parseExposureCsv } from "@/services/analyze-exposure-heatmap";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  csvText: z.string().min(40, "Provide a fuller CSV payload (header + at least one data row)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_exposureheatmap under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_exposureheatmap. Grant schema/table/sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/exposure-accumulation-heatmap/db/init_exposureheatmap.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  csvText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof analyzeExposureCsv>
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
      .schema(exposureHeatmapApp.schema)
      .from("app_exposureheatmap_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_csv_text: csvText,
        question: question ?? null,
        summary: analysis.summary,
        hotspots: analysis.hotspots,
        heat_points: analysis.heatPoints,
        country_concentration: analysis.countryConcentration,
        warnings: analysis.warnings,
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
      .schema(exposureHeatmapApp.schema)
      .from("app_exposureheatmap_audit")
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
    appKey: exposureHeatmapApp.shortName,
    requestId
  });

  logger.info("exposure heatmap analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid exposure heatmap payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const parsedCsv = parseExposureCsv(parsed.data.csvText);
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

    const analysis = analyzeExposureCsv(parsed.data.csvText, parsed.data.question);

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.csvText,
      parsed.data.question,
      parsed.data.sourceLabel,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      rowCount: analysis.summary.rowCount,
      totalTiv: analysis.summary.totalTiv,
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
    const message = error instanceof Error ? error.message : "Exposure heatmap analysis failed.";

    await persistAudit(requestId, "analysis_failed", {
      error: message
    });

    logger.warn("exposure heatmap analysis failed", {
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

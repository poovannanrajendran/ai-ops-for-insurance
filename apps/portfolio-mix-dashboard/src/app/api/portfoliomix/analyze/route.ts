import { hasSupabaseServerAccess, portfolioMixApp } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { buildPortfolioInsight } from "@/services/analyze-portfolio";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  csvText: z.string().min(20, "Provide a CSV with headers and at least one portfolio row."),
  sourceLabel: z.string().max(120).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (
    reason.includes("Invalid schema") ||
    reason.includes("PGRST106")
  ) {
    return "Supabase schema is not exposed in Data API. Add app_portfoliomix under API -> Data API -> Exposed schemas, then retry.";
  }

  if (
    reason.includes("permission denied for schema") ||
    reason.includes("permission denied for sequence")
  ) {
    return "Supabase permissions are incomplete for app_portfoliomix. Grant schema, table, and sequence privileges to service_role (and other runtime roles if needed), then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/portfolio-mix-dashboard/db/init_portfoliomix.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  csvText: string,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof buildPortfolioInsight>
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
      .schema(portfolioMixApp.schema)
      .from("app_portfoliomix_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_csv_text: csvText,
        total_records: analysis.summary.totalRecords,
        class_distribution: analysis.summary.classDistribution,
        territory_distribution: analysis.summary.territoryDistribution,
        limit_band_distribution: analysis.summary.limitBandDistribution,
        currencies: analysis.summary.currencies,
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
        error instanceof Error
          ? formatPersistenceFailure(error.message)
          : "Unknown persistence error"
    } as const;
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({
    appKey: portfolioMixApp.shortName,
    requestId
  });

  logger.info("portfolio analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("portfolio analysis rejected", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid portfolio payload."
      },
      { status: 400 }
    );
  }

  try {
    const analysis = buildPortfolioInsight(parsed.data.csvText);
    logger.info("portfolio analysis completed", {
      totalRecords: analysis.summary.totalRecords,
      warningCount: analysis.warnings.length
    });

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.csvText,
      parsed.data.sourceLabel,
      analysis
    );

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portfolio analysis failed.";
    logger.warn("portfolio analysis failed", {
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

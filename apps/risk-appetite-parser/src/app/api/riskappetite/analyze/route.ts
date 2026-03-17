import { hasSupabaseServerAccess, riskAppetiteApp } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { buildRiskAppetiteInsight } from "@/services/analyze-risk-appetite";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  statementText: z
    .string()
    .min(80, "Provide a risk appetite statement with enough text for extraction."),
  sourceLabel: z.string().max(120).optional(),
  question: z.string().max(240).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (
    reason.includes("Invalid schema") ||
    reason.includes("PGRST106")
  ) {
    return "Supabase schema is not exposed in Data API. Add app_riskappetite under API -> Data API -> Exposed schemas, then retry.";
  }

  if (
    reason.includes("permission denied for schema") ||
    reason.includes("permission denied for sequence")
  ) {
    return "Supabase permissions are incomplete for app_riskappetite. Grant schema, table, and sequence privileges to service_role (and other runtime roles if needed), then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/risk-appetite-parser/db/init_riskappetite.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  statementText: string,
  question: string | undefined,
  sourceLabel: string | undefined,
  analysis: ReturnType<typeof buildRiskAppetiteInsight>
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
      .schema(riskAppetiteApp.schema)
      .from("app_riskappetite_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_statement_text: statementText,
        question: question ?? null,
        field_coverage: analysis.summary.fieldCoverage,
        matched_fields: analysis.summary.matchedFields,
        missing_fields: analysis.summary.missingFields,
        structured_data: analysis.structuredData,
        whitespace_fields: analysis.whitespaceFields,
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
    appKey: riskAppetiteApp.shortName,
    requestId
  });

  logger.info("risk appetite analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("risk appetite analysis rejected", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid risk appetite payload."
      },
      { status: 400 }
    );
  }

  try {
    const analysis = buildRiskAppetiteInsight(parsed.data.statementText, parsed.data.question);
    logger.info("risk appetite analysis completed", {
      fieldCoverage: analysis.summary.fieldCoverage,
      warningCount: analysis.warnings.length
    });

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.statementText,
      parsed.data.question,
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
    const message = error instanceof Error ? error.message : "Risk appetite analysis failed.";
    logger.warn("risk appetite analysis failed", {
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

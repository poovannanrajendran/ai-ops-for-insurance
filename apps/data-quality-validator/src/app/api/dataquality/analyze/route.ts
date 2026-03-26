import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeDataQuality } from "@/services/analyze-data-quality";

const appConfig = {
  shortName: "dataquality",
  schema: "app_dataquality"
} as const;

const requestSchema = z.object({
  datasetText: z.string().min(80, "Provide fuller dataset text (minimum 80 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_dataquality under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_dataquality. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/data-quality-validator/db/init_dataquality.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) return;
  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(appConfig.schema).from("app_dataquality_audit").insert({
      request_id: requestId,
      stage,
      payload
    });
  } catch {
    // non-blocking audit path
  }
}

async function persistAnalysis(
  requestId: string,
  datasetText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeDataQuality>["insight"]
) {
  if (!hasSupabaseServerAccess()) {
    return { status: "skipped", reason: "Supabase server credentials are not configured yet." } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(appConfig.schema)
      .from("app_dataquality_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        dataset_text: datasetText,
        question: question ?? null,
        summary: analysis.summary,
        issues: analysis.issues,
        fix_suggestions: analysis.fixSuggestions,
        briefing_narrative: analysis.briefingNarrative,
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data quality payload." },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analyzed = await withTimeout(
      Promise.resolve(analyzeDataQuality(parsed.data.datasetText, parsed.data.question)),
      3000
    );

    if (analyzed.missing.length > 0) {
      await persistAudit(requestId, "validation_failed", { missing: analyzed.missing });
      return NextResponse.json(
        { error: `Missing required quality fields: ${analyzed.missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.datasetText,
      parsed.data.sourceLabel,
      parsed.data.question,
      analyzed.insight
    );

    await persistAudit(requestId, "analysis_completed", {
      qualityState: analyzed.insight.summary.qualityState,
      highIssues: analyzed.insight.summary.highIssues,
      persistenceStatus: persistence.status
    });

    logger.info("data quality analysis completed", {
      qualityState: analyzed.insight.summary.qualityState,
      highIssues: analyzed.insight.summary.highIssues,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis: analyzed.insight,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data quality analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("data quality analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

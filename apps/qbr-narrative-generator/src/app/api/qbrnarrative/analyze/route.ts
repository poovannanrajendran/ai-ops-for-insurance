import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeQbrNarrative } from "@/services/analyze-qbr-narrative";

const appConfig = {
  shortName: "qbrnarrative",
  schema: "app_qbrnarrative"
} as const;

const requestSchema = z.object({
  qbrText: z.string().min(20, "Provide fuller metric text (minimum 20 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_qbrnarrative under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_qbrnarrative. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/qbr-narrative-generator/db/init_qbrnarrative.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) return;
  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(appConfig.schema).from("app_qbrnarrative_audit").insert({
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
  qbrText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeQbrNarrative>
) {
  if (!hasSupabaseServerAccess()) {
    return { status: "skipped", reason: "Supabase server credentials are not configured yet." } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(appConfig.schema)
      .from("app_qbrnarrative_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        qbr_text: qbrText,
        question: question ?? null,
        summary: analysis.summary,
        extracted_fields: analysis.extractedFields,
        executive_narrative: analysis.executiveNarrative,
        board_talking_points: analysis.boardTalkingPoints,
        prompt_hits: analysis.promptHits,
        warnings: analysis.warnings,
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid QBR payload." }, { status: 400 });
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const insight = await withTimeout(
      Promise.resolve(
        analyzeQbrNarrative({
          qbrText: parsed.data.qbrText,
          sourceLabel: parsed.data.sourceLabel ?? "qbr-input.txt",
          question: parsed.data.question ?? "What should the board narrative highlight?"
        })
      ),
      3000
    );

    const missing = insight.whitespaceRows.filter((row) => row.status === "MISSING").map((row) => row.fieldWording);
    if (missing.length > 0) {
      await persistAudit(requestId, "validation_failed", { missing });
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });
    }

    const persistence = await persistAnalysis(requestId, parsed.data.qbrText, parsed.data.sourceLabel, parsed.data.question, insight);

    await persistAudit(requestId, "analysis_completed", {
      performanceState: insight.summary.performanceState,
      confidence: insight.summary.narrativeConfidence,
      persistenceStatus: persistence.status
    });

    logger.info("qbr narrative analysis completed", {
      performanceState: insight.summary.performanceState,
      confidence: insight.summary.narrativeConfidence,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis: insight,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "QBR narrative analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("qbr narrative analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

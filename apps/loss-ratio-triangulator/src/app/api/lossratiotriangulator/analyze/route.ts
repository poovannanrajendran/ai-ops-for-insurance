import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeTriangle } from "@/services/analyze-triangle";

const appConfig = {
  shortName: "lossratiotriangulator",
  schema: "app_lossratiotriangulator"
} as const;

const requestSchema = z.object({
  triangleText: z.string().min(20, "Provide fuller triangle text (minimum 20 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_lossratiotriangulator under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_lossratiotriangulator. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/loss-ratio-triangulator/db/init_lossratiotriangulator.sql in your target project, then retry.";
  }
  return reason;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
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

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) return;
  try {
    const supabase = createSupabaseServerClient();
    await withTimeout(
      Promise.resolve(
        supabase.schema(appConfig.schema).from("app_lossratiotriangulator_audit").insert({
          request_id: requestId,
          stage,
          payload
        })
      ),
      1500
    );
  } catch {
    // non-blocking
  }
}

async function persistAnalysis(
  requestId: string,
  triangleText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeTriangle>
) {
  if (!hasSupabaseServerAccess()) {
    return { status: "skipped", reason: "Supabase server credentials are not configured yet." } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await withTimeout(
      Promise.resolve(
        supabase
          .schema(appConfig.schema)
          .from("app_lossratiotriangulator_analysis_runs")
          .insert({
            request_id: requestId,
            source_label: sourceLabel ?? null,
            triangle_text: triangleText,
            question: question ?? null,
            summary: analysis.summary,
            triangle: analysis.triangle,
            ldfs: analysis.ldfs,
            accident_year_results: analysis.results,
            methodology: analysis.methodology,
            audit_notes: analysis.auditNotes,
            prompt_hits: analysis.promptHits,
            whitespace_rows: analysis.whitespaceRows,
            raw_analysis: analysis
          })
      ),
      2500
    );

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

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({ appKey: appConfig.shortName, requestId });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    void persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid triangle payload." }, { status: 400 });
  }

  try {
    const analysis = await withTimeout(
      Promise.resolve(
        analyzeTriangle({
          triangleText: parsed.data.triangleText,
          sourceLabel: parsed.data.sourceLabel ?? "triangle.csv",
          question: parsed.data.question ?? "Which accident years require reserving attention?"
        })
      ),
      3000
    );

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.triangleText,
      parsed.data.sourceLabel,
      parsed.data.question,
      analysis
    );

    void persistAudit(requestId, "analysis_completed", {
      reservingBand: analysis.summary.reservingBand,
      confidence: analysis.summary.confidence,
      persistenceStatus: persistence.status
    });

    logger.info("triangle analysis completed", {
      reservingBand: analysis.summary.reservingBand,
      confidence: analysis.summary.confidence,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Triangle analysis failed.";
    void persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("triangle analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

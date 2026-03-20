import { NextResponse } from "next/server";
import { z } from "zod";

import { createLogger, createSupabaseServerClient, hasSupabaseServerAccess } from "@/lib/server/supabase";
import { analyzeFnolTriage } from "@/services/analyze-fnol-triage";

const app = {
  schema: "app_fnoltriage",
  shortName: "fnoltriage"
} as const;

const requestSchema = z.object({
  fnolText: z.string().min(140, "Provide a fuller FNOL notice with the core claim facts and reserve markers."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_fnoltriage under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_fnoltriage. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/claims-fnol-triage-assistant/db/init_fnoltriage.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAnalysis(
  requestId: string,
  fnolText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeFnolTriage>
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
      .schema(app.schema)
      .from("app_fnoltriage_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        raw_fnol_text: fnolText,
        question: question ?? null,
        summary: analysis.summary,
        parsed_fnol: analysis.parsedFnol,
        factors: analysis.factors,
        warnings: analysis.warnings,
        decision: analysis.decision,
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
    await supabase.schema(app.schema).from("app_fnoltriage_audit").insert({
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
  const logger = createLogger({ appKey: app.shortName, requestId });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid FNOL triage payload."
      },
      { status: 400 }
    );
  }

  try {
    logger.info("fnol triage started");

    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = analyzeFnolTriage(parsed.data.fnolText, parsed.data.question);
    const persistence = await persistAnalysis(requestId, parsed.data.fnolText, parsed.data.sourceLabel, parsed.data.question, analysis);

    await persistAudit(requestId, "triage_completed", {
      disposition: analysis.summary.disposition,
      triageScore: analysis.summary.triageScore,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FNOL triage failed.";

    await persistAudit(requestId, "triage_failed", { error: message });
    logger.warn("fnol triage failed", { error: message });

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}

import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeRegulatoryDigest } from "@/services/analyze-regulatory-digest";

const appConfig = {
  shortName: "regulatorydigest",
  schema: "app_regulatorydigest"
} as const;

const requestSchema = z.object({
  feedText: z.string().min(120, "Provide fuller regulatory feed text (minimum 120 characters)."),
  classFocus: z.string().min(3, "Provide at least one class focus for relevance scoring."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_regulatorydigest under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_regulatorydigest. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/regulatory-update-digest/db/init_regulatorydigest.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(appConfig.schema).from("app_regulatorydigest_audit").insert({
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
  feedText: string,
  classFocus: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeRegulatoryDigest>
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
      .schema(appConfig.schema)
      .from("app_regulatorydigest_analysis_runs")
      .insert({
        request_id: requestId,
        source_label: sourceLabel ?? null,
        feed_text: feedText,
        class_focus: classFocus,
        question: question ?? null,
        summary: analysis.summary,
        executive_brief: analysis.executiveBrief,
        priority_alerts: analysis.priorityAlerts,
        actions: analysis.actions,
        updates: analysis.updates,
        warnings: analysis.warnings,
        query_hits: analysis.queryHits,
        whitespace_rows: analysis.whitespaceRows,
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Analysis timeout exceeded."));
    }, timeoutMs);

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

  logger.info("regulatory digest analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    logger.warn("regulatory digest validation failed", { issues: parsed.error.issues });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid regulatory digest payload." }, { status: 400 });
  }

  try {
    await persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const analysis = await withTimeout(
      Promise.resolve(analyzeRegulatoryDigest(parsed.data.feedText, parsed.data.classFocus, parsed.data.question)),
      3000
    );

    if (analysis.summary.bulletinCount < 2 || analysis.warnings.some((warning) => warning.includes("missing required fields"))) {
      await persistAudit(requestId, "validation_failed", {
        bulletinCount: analysis.summary.bulletinCount,
        warnings: analysis.warnings
      });

      return NextResponse.json(
        {
          error:
            analysis.summary.bulletinCount < 2
              ? "At least two complete regulatory bulletin entries are required."
              : "Feed contains bulletin entries with missing required fields (source/title/date/class/update/action)."
        },
        { status: 400 }
      );
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.feedText,
      parsed.data.classFocus,
      parsed.data.sourceLabel,
      parsed.data.question,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      bulletinCount: analysis.summary.bulletinCount,
      highSeverityCount: analysis.summary.highSeverityCount,
      persistenceStatus: persistence.status
    });

    logger.info("regulatory digest analysis completed", {
      bulletinCount: analysis.summary.bulletinCount,
      highSeverityCount: analysis.summary.highSeverityCount,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Regulatory digest analysis failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("regulatory digest analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

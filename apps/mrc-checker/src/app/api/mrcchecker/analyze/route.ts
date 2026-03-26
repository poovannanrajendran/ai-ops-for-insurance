import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";

import { analyzeMrcText } from "@/services/analyze-mrc";
import { mrcCheckRequestSchema } from "@/types/mrc-checker";

const mrcCheckerApp = {
  schema: "app_mrcchecker",
  shortName: "mrcchecker"
} as const;
const PERSISTENCE_TIMEOUT_MS = 4000;

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizePersistenceError(message: string): string {
  if (message.includes("PGRST106") || message.includes("Invalid schema")) {
    return "Supabase schema is not exposed in Data API. Add app_mrcchecker under API -> Data API -> Exposed schemas, then retry.";
  }
  if (message.includes("permission denied")) {
    return "Supabase permissions are incomplete for app_mrcchecker. Grant schema, table, and sequence privileges, then retry.";
  }
  if (message.includes("relation") || message.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/mrc-checker/db/init_mrcchecker.sql in your target project, then retry.";
  }
  return message;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }
  try {
    const supabase = createSupabaseServerClient();
    await withTimeout(
      supabase.schema(mrcCheckerApp.schema).from("app_mrcchecker_audit").insert({
        payload,
        request_id: requestId,
        stage
      }),
      PERSISTENCE_TIMEOUT_MS,
      "Audit persistence timed out."
    );
  } catch {
    // Audit writes are non-blocking.
  }
}

async function persistRun(
  requestId: string,
  mrcText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeMrcText>
) {
  if (!hasSupabaseServerAccess()) {
    return {
      reason: "Supabase server credentials are not configured yet.",
      status: "skipped"
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const insertResult = await withTimeout(
      supabase
        .schema(mrcCheckerApp.schema)
        .from("app_mrcchecker_analysis_runs")
        .insert({
          attention_fields: analysis.summary.attentionFields,
          clause_checks: analysis.clauseChecks,
          field_coverage: analysis.summary.fieldCoverage,
          field_checks: analysis.fieldChecks,
          gate_passed: analysis.summary.gatePassed,
          matched_fields: analysis.summary.matchedFields,
          missing_fields: analysis.summary.missingFields,
          missing_required_fields: analysis.summary.missingRequiredFields,
          question: question ?? null,
          raw_analysis: analysis,
          raw_input: mrcText,
          referrals: analysis.referrals,
          request_id: requestId,
          source_label: sourceLabel ?? null,
          structured_data: analysis.structuredData,
          summary: analysis.summary,
          warnings: analysis.warnings
        }),
      PERSISTENCE_TIMEOUT_MS,
      "Analysis persistence timed out."
    );
    const { error } = insertResult as { error: { message: string } | null };

    if (error) {
      return {
        reason: normalizePersistenceError(error.message),
        status: "failed"
      } as const;
    }

    return { status: "stored" } as const;
  } catch (error) {
    return {
      reason: normalizePersistenceError(error instanceof Error ? error.message : "Unknown persistence error"),
      status: "failed"
    } as const;
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({ appKey: mrcCheckerApp.shortName, requestId });

  const body = await request.json().catch(() => null);
  const parsed = mrcCheckRequestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid mrc checker payload." },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      hasQuestion: Boolean(parsed.data.question),
      sourceLabel: parsed.data.sourceLabel ?? null
    });

    const analysis = analyzeMrcText(parsed.data.mrcText, parsed.data.question);
    const persistence = await persistRun(
      requestId,
      parsed.data.mrcText,
      parsed.data.sourceLabel,
      parsed.data.question,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      gatePassed: analysis.summary.gatePassed,
      persistenceStatus: persistence.status,
      referralCount: analysis.summary.referralCount,
      warningCount: analysis.summary.warningCount
    });

    return NextResponse.json({
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt,
      requestId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MRC check failed.";
    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("mrc checker analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

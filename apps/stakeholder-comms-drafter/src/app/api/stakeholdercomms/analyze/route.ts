import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { stakeholderCommsDrafterApp } from "@/lib/app-config";
import { analyzeStakeholderComms } from "@/services/analyze-stakeholder-comms";

const requestSchema = z.object({
  sourceLabel: z.string().max(160).optional(),
  commsText: z.string().min(80, "Provide a fuller stakeholder comms note."),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_stakeholdercomms under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_stakeholdercomms. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/stakeholder-comms-drafter/db/init_stakeholdercomms.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAnalysis(
  requestId: string,
  sourceLabel: string | undefined,
  commsText: string,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeStakeholderComms>["analysis"]
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
      .schema(stakeholderCommsDrafterApp.schema)
      .from("comms_runs")
      .insert({
        source_label: sourceLabel ?? "manual-entry.txt",
        comms_type: analysis.summary.commsType,
        audience: analysis.summary.audience,
        tone: analysis.fields.find((field) => field.field === "tone")?.value ?? "Unspecified",
        subject: analysis.fields.find((field) => field.field === "subject")?.value ?? "Unspecified",
        status: analysis.summary.status,
        completeness_pct: analysis.summary.completenessPct,
        confidence: analysis.summary.confidence,
        key_messages: analysis.keyMessages,
        actions: analysis.actions,
        draft: analysis.draft,
        prompt_hits: analysis.promptHits,
        warnings: analysis.warnings
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
    await supabase.schema(stakeholderCommsDrafterApp.schema).from("comms_audit").insert({
      source_label: String(payload.sourceLabel ?? "manual-entry.txt"),
      status: String(payload.status ?? "unknown"),
      completeness_pct: Number(payload.completenessPct ?? 0),
      confidence: String(payload.confidence ?? "unknown"),
      warning_count: Number(payload.warningCount ?? 0)
    });
  } catch {
    // Audit logging should never block the request.
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({
    appKey: stakeholderCommsDrafterApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", {
      sourceLabel: "manual-entry.txt",
      status: "validation_failed",
      completenessPct: 0,
      confidence: "low",
      warningCount: 1
    });
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 }
    );
  }

  try {
    const { analysis } = analyzeStakeholderComms({
      sourceLabel: parsed.data.sourceLabel,
      commsText: parsed.data.commsText,
      prompt: parsed.data.question
    });

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.sourceLabel,
      parsed.data.commsText,
      parsed.data.question,
      analysis
    );

    await persistAudit(requestId, "analysis_completed", {
      sourceLabel: parsed.data.sourceLabel ?? "manual-entry.txt",
      status: analysis.summary.status,
      completenessPct: analysis.summary.completenessPct,
      confidence: analysis.summary.confidence,
      warningCount: analysis.warnings.length
    });

    return NextResponse.json({
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt,
      requestId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stakeholder comms analysis failed.";
    logger.warn("stakeholder comms analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

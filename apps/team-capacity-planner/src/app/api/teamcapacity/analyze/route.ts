import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeTeamCapacity } from "@/services/analyze-team-capacity";

const appConfig = {
  shortName: "teamcapacity",
  schema: "app_teamcapacity"
} as const;

const requestSchema = z.object({
  capacityText: z.string().min(20, "Provide fuller capacity text (minimum 20 characters)."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_teamcapacity under API -> Data API -> Exposed schemas, then retry.";
  }
  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_teamcapacity. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }
  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/team-capacity-planner/db/init_teamcapacity.sql in your target project, then retry.";
  }
  return reason;
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) return;
  try {
    const supabase = createSupabaseServerClient();
    await withTimeout(
      Promise.resolve(
        supabase.schema(appConfig.schema).from("app_teamcapacity_audit").insert({
          request_id: requestId,
          stage,
          payload
        })
      ),
      1500
    );
  } catch {
    // non-blocking audit path
  }
}

async function persistAnalysis(
  requestId: string,
  capacityText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof analyzeTeamCapacity>
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
          .from("app_teamcapacity_analysis_runs")
          .insert({
            request_id: requestId,
            source_label: sourceLabel ?? null,
            capacity_text: capacityText,
            question: question ?? null,
            summary: analysis.summary,
            extracted_fields: analysis.extractedFields,
            allocation_narrative: analysis.allocationNarrative,
            action_plan: analysis.actionPlan,
            prompt_hits: analysis.promptHits,
            warnings: analysis.warnings,
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
    void persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid team capacity payload." }, { status: 400 });
  }

  try {
    void persistAudit(requestId, "request_received", {
      sourceLabel: parsed.data.sourceLabel ?? null,
      hasQuestion: Boolean(parsed.data.question)
    });

    const insight = await withTimeout(
      Promise.resolve(
        analyzeTeamCapacity({
          capacityText: parsed.data.capacityText,
          sourceLabel: parsed.data.sourceLabel ?? "team-capacity.txt",
          question: parsed.data.question ?? "Where are immediate capacity pressure points?"
        })
      ),
      3000
    );

    const missing = insight.whitespaceRows.filter((row) => row.status === "MISSING" && !row.optional).map((row) => row.fieldWording);
    if (missing.length > 0) {
      void persistAudit(requestId, "validation_failed", { missing });
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });
    }

    const persistence = await persistAnalysis(
      requestId,
      parsed.data.capacityText,
      parsed.data.sourceLabel,
      parsed.data.question,
      insight
    );

    void persistAudit(requestId, "analysis_completed", {
      capacityState: insight.summary.capacityState,
      confidence: insight.summary.confidence,
      persistenceStatus: persistence.status
    });

    logger.info("team capacity analysis completed", {
      capacityState: insight.summary.capacityState,
      confidence: insight.summary.confidence,
      persistenceStatus: persistence.status
    });

    return NextResponse.json({
      requestId,
      analysis: insight,
      persistence,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Team capacity analysis failed.";
    void persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("team capacity analysis failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

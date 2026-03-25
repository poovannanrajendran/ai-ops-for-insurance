import { hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildPlacementInsight, parsePlacementCsv } from "@/services/analyze-placement";

const placementTrackerApp = {
  schema: "app_placementtracker",
  shortName: "placementtracker"
} as const;

const requestSchema = z.object({
  csvText: z.string().min(180, "Provide a fuller placement dataset with the required CSV columns and at least two market rows."),
  question: z.string().max(280).optional(),
  sourceLabel: z.string().max(160).optional()
});

function formatPersistenceFailure(reason: string): string {
  if (reason.includes("Invalid schema") || reason.includes("PGRST106")) {
    return "Supabase schema is not exposed in Data API. Add app_placementtracker under API -> Data API -> Exposed schemas, then retry.";
  }

  if (reason.includes("permission denied for schema") || reason.includes("permission denied for sequence")) {
    return "Supabase permissions are incomplete for app_placementtracker. Grant schema, table, and sequence privileges to runtime roles, then retry.";
  }

  if (reason.includes("relation") || reason.includes("does not exist")) {
    return "Supabase schema is not bootstrapped yet. Run apps/placement-tracker/db/init_placementtracker.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(
  requestId: string,
  csvText: string,
  sourceLabel: string | undefined,
  question: string | undefined,
  analysis: ReturnType<typeof buildPlacementInsight>
) {
  if (!hasSupabaseServerAccess()) {
    return {
      reason: "Supabase server credentials are not configured yet.",
      status: "skipped"
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(placementTrackerApp.schema)
      .from("app_placementtracker_analysis_runs")
      .insert({
        commentary: analysis.commentary,
        market_progression: analysis.marketProgression,
        priority_flags: analysis.priorityFlags,
        query_hits: analysis.queryHits,
        question: question ?? null,
        raw_analysis: analysis,
        raw_csv_text: csvText,
        request_id: requestId,
        source_label: sourceLabel ?? null,
        status_lanes: analysis.statusLanes,
        summary: analysis.summary
      });

    if (error) {
      return {
        reason: formatPersistenceFailure(error.message),
        status: "failed"
      } as const;
    }

    return { status: "stored" } as const;
  } catch (error) {
    return {
      reason: error instanceof Error ? formatPersistenceFailure(error.message) : "Unknown persistence error",
      status: "failed"
    } as const;
  }
}

async function persistAudit(requestId: string, stage: string, payload: Record<string, unknown>) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase.schema(placementTrackerApp.schema).from("app_placementtracker_audit").insert({
      payload,
      request_id: requestId,
      stage
    });
  } catch {
    // Audit writes must never block the request path.
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({
    appKey: placementTrackerApp.shortName,
    requestId
  });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    await persistAudit(requestId, "validation_failed", { issues: parsed.error.issues });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid placement tracker payload."
      },
      { status: 400 }
    );
  }

  try {
    await persistAudit(requestId, "request_received", {
      hasQuestion: Boolean(parsed.data.question),
      sourceLabel: parsed.data.sourceLabel ?? null
    });

    const parsedCsv = parsePlacementCsv(parsed.data.csvText);
    if (parsedCsv.errors.length > 0) {
      await persistAudit(requestId, "validation_failed", {
        csvErrors: parsedCsv.errors
      });

      return NextResponse.json(
        {
          error: parsedCsv.errors[0]
        },
        { status: 400 }
      );
    }

    const analysis = buildPlacementInsight(parsed.data.csvText, parsed.data.question);
    const persistence = await persistAnalysis(requestId, parsed.data.csvText, parsed.data.sourceLabel, parsed.data.question, analysis);

    await persistAudit(requestId, "analysis_completed", {
      openSharePct: analysis.summary.openSharePct,
      persistenceStatus: persistence.status,
      placedSharePct: analysis.summary.placedSharePct,
      projectedSharePct: analysis.summary.projectedSharePct
    });

    return NextResponse.json({
      analysis,
      persistence,
      processingTimeMs: Date.now() - startedAt,
      requestId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Placement tracker analysis failed.";

    await persistAudit(requestId, "analysis_failed", { error: message });
    logger.warn("placement tracker analysis failed", { error: message });

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}

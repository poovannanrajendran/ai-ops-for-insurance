import { submissionTriageApp, hasSupabaseServerAccess } from "@ai-ops/config";
import { createLogger, createSupabaseServerClient } from "@ai-ops/lib";
import { analyzeSubmission } from "@/services/analyze-submission";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  submissionText: z.string().min(40, "Provide more submission detail before analysis.")
});

function formatPersistenceFailure(reason: string): string {
  if (
    reason.includes("Invalid schema") ||
    reason.includes("relation") ||
    reason.includes("does not exist")
  ) {
    return "Supabase schema is not bootstrapped yet. Run apps/submission-triage-copilot/db/init_submissiontriage.sql in your target project, then retry.";
  }

  return reason;
}

async function persistAnalysis(requestId: string, submissionText: string, analysis: ReturnType<typeof analyzeSubmission>) {
  if (!hasSupabaseServerAccess()) {
    return {
      status: "skipped",
      reason: "Supabase server credentials are not configured yet."
    } as const;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .schema(submissionTriageApp.schema)
      .from("app_submissiontriage_core")
      .insert({
        request_id: requestId,
        submitted_text: submissionText,
        insured_name: analysis.extracted.insuredName,
        broker_contact: analysis.extracted.brokerContact,
        headquarters: analysis.extracted.headquarters,
        attachment: analysis.extracted.attachment,
        business: analysis.extracted.business,
        revenue: analysis.extracted.revenue,
        employees: analysis.extracted.employees,
        locations: analysis.extracted.locations,
        construction: analysis.extracted.construction,
        occupancy: analysis.extracted.occupancy,
        fire_protection: analysis.extracted.fireProtection,
        nat_cat: analysis.extracted.natCat,
        risk_controls: analysis.extracted.riskControls,
        claims_history: analysis.extracted.claimsHistory,
        loss_history: analysis.extracted.lossHistory,
        expiring_carrier: analysis.extracted.expiringCarrier,
        expiring_premium: analysis.extracted.expiringPremium,
        desired_inception: analysis.extracted.desiredInception,
        broker_objective: analysis.extracted.brokerObjective,
        notes: analysis.extracted.notes,
        class_of_business: analysis.extracted.classOfBusiness,
        territory: analysis.extracted.territory,
        currency: analysis.extracted.currency,
        limit_amount: analysis.extracted.limitAmount,
        decision: analysis.decision,
        confidence: analysis.confidence,
        rationale: analysis.rationale,
        extracted_fields: analysis.extracted,
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

async function persistAudit(
  requestId: string,
  stage: string,
  payload: Record<string, unknown>
) {
  if (!hasSupabaseServerAccess()) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase
      .schema(submissionTriageApp.schema)
      .from("app_submissiontriage_audit")
      .insert({
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
  const logger = createLogger({
    appKey: submissionTriageApp.shortName,
    requestId
  });

  logger.info("submission analysis started");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("submission analysis rejected", {
      issues: parsed.error.issues
    });

    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid submission payload."
      },
      { status: 400 }
    );
  }

  await persistAudit(requestId, "request_received", {
    submissionText: parsed.data.submissionText
  });

  const analysis = analyzeSubmission(parsed.data.submissionText);
  logger.info("submission analysis completed", {
    decision: analysis.decision,
    classOfBusiness: analysis.extracted.classOfBusiness,
    territory: analysis.extracted.territory,
    processingTimeMs: Date.now() - startedAt
  });

  const missingFields: string[] = [];
  if (!analysis.extracted.broker) missingFields.push("Broker");
  if (!analysis.extracted.insuredName) missingFields.push("Insured Name");
  if (analysis.extracted.classOfBusiness === "Unknown") missingFields.push("Class Of Business");
  if (analysis.extracted.territory === "Unclear") missingFields.push("Territory");
  if (analysis.extracted.limitAmount == null) missingFields.push("Limit Amount");
  if (!analysis.extracted.currency) missingFields.push("Currency");

  if (missingFields.length > 0) {
    await persistAudit(requestId, "validation_failed", {
      missingFields,
      extracted: analysis.extracted
    });

    return NextResponse.json(
      {
        error: "Required submission fields are missing.",
        missingFields
      },
      { status: 400 }
    );
  }

  const persistence = await persistAnalysis(requestId, parsed.data.submissionText, analysis);
  await persistAudit(requestId, "analysis_completed", {
    analysis,
    persistence
  });

  return NextResponse.json({
    requestId,
    analysis,
    persistence,
    processingTimeMs: Date.now() - startedAt
  });
}

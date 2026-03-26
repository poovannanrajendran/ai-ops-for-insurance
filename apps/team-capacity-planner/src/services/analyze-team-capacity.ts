import { z } from "zod";

import type { DerivedMetrics, TeamCapacityFields, TeamCapacityInsight, TeamCapacityWhitespaceRow } from "@/types/team-capacity";

const requestSchema = z.object({
  capacityText: z.string().min(20),
  sourceLabel: z.string().min(3),
  question: z.string().min(6)
});

const requiredNumericFields = [
  "team_size",
  "available_capacity_fte",
  "in_flight_work_items",
  "avg_cycle_days",
  "urgent_queue",
  "specialist_gap_count",
  "overtime_pct"
] as const;

const optionalFields = new Set<string>([
  "team_name",
  "reporting_week",
  "absentee_count",
  "target_cycle_days",
  "sla_breach_count",
  "new_submissions_week",
  "referral_backlog"
]);

const wordingMap: Record<keyof TeamCapacityFields, string> = {
  team_name: "Team / division",
  reporting_week: "Reporting week",
  team_size: "Team size",
  available_capacity_fte: "Available capacity (FTE)",
  absentee_count: "Absentee count",
  in_flight_work_items: "In-flight work items",
  avg_cycle_days: "Average cycle days",
  target_cycle_days: "Target cycle days",
  urgent_queue: "Urgent queue",
  sla_breach_count: "SLA breach count",
  new_submissions_week: "New submissions (week)",
  specialist_gap_count: "Specialist gap count",
  referral_backlog: "Referral backlog",
  overtime_pct: "Overtime %",
  key_skill_note: "Key skill note"
};

function parsePayload(text: string): Record<string, string> {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const idx = line.indexOf("=");
      if (idx < 0) return acc;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[,_\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function derivedMetrics(fields: TeamCapacityFields): DerivedMetrics {
  const fte = fields.available_capacity_fte ?? 1;
  const absentees = fields.absentee_count ?? 0;
  const effectiveFte = Math.max(1, fte - absentees);
  const inFlight = fields.in_flight_work_items ?? 0;
  const utilizationRate = Number((inFlight / effectiveFte).toFixed(2));
  const utilizationPct = Math.min(100, Math.round((utilizationRate / 4) * 100));

  const slaBreachCount = fields.sla_breach_count ?? 0;
  const slaBreachRatePct = inFlight > 0 ? Math.round((slaBreachCount / inFlight) * 100) : 0;

  const newSubmissions = fields.new_submissions_week ?? 0;
  const queueVelocityDelta = newSubmissions - effectiveFte * 2;

  const cycleVsTarget =
    fields.avg_cycle_days != null && fields.target_cycle_days != null
      ? Number((fields.avg_cycle_days - fields.target_cycle_days).toFixed(1))
      : null;

  const capacityRunwayDays =
    queueVelocityDelta > 0 && effectiveFte > 0
      ? Math.round((effectiveFte * 10 - inFlight) / queueVelocityDelta)
      : null;

  return { effectiveFte, utilizationRate, utilizationPct, slaBreachRatePct, queueVelocityDelta, cycleVsTarget, capacityRunwayDays };
}

export function analyzeTeamCapacity(input: unknown): TeamCapacityInsight {
  const parsed = requestSchema.parse(input);
  const payload = parsePayload(parsed.capacityText);

  const extracted: TeamCapacityFields = {
    team_name: payload.team_name ?? "",
    reporting_week: payload.reporting_week ?? "",
    team_size: toNumber(payload.team_size),
    available_capacity_fte: toNumber(payload.available_capacity_fte),
    absentee_count: toNumber(payload.absentee_count),
    in_flight_work_items: toNumber(payload.in_flight_work_items),
    avg_cycle_days: toNumber(payload.avg_cycle_days),
    target_cycle_days: toNumber(payload.target_cycle_days),
    urgent_queue: toNumber(payload.urgent_queue),
    sla_breach_count: toNumber(payload.sla_breach_count),
    new_submissions_week: toNumber(payload.new_submissions_week),
    specialist_gap_count: toNumber(payload.specialist_gap_count),
    referral_backlog: toNumber(payload.referral_backlog),
    overtime_pct: toNumber(payload.overtime_pct),
    key_skill_note: payload.key_skill_note ?? ""
  };

  const missing = requiredNumericFields.filter((field) => extracted[field] == null);
  const denominator = requiredNumericFields.length + 1; // +1 for key_skill_note
  const completeness = denominator - missing.length - (extracted.key_skill_note ? 0 : 1);
  const completenessPct = Math.max(0, Math.round((completeness / denominator) * 100));

  const dm = derivedMetrics(extracted);

  const warnings: string[] = [];
  if (missing.length) warnings.push(`Missing required numeric fields: ${missing.join(", ")}.`);
  if (dm.utilizationRate >= 3.5) warnings.push(`Utilization at ${dm.utilizationRate}× load — team is critically overloaded.`);
  if ((extracted.urgent_queue ?? 0) >= 10) warnings.push("Urgent queue is elevated and requires immediate allocation control.");
  if ((extracted.overtime_pct ?? 0) >= 18) warnings.push("Overtime exceeds 18%; burnout risk is escalating.");
  if ((extracted.specialist_gap_count ?? 0) > 0) warnings.push("Specialist coverage gaps detected in critical workflows.");
  if (dm.slaBreachRatePct >= 20) warnings.push(`SLA breach rate at ${dm.slaBreachRatePct}% — escalation required.`);
  if (dm.queueVelocityDelta > 0) warnings.push("Intake is outpacing throughput — backlog is growing this week.");

  const capacityState: TeamCapacityInsight["summary"]["capacityState"] =
    dm.utilizationRate >= 3.5 || (extracted.overtime_pct ?? 0) >= 18 || (extracted.urgent_queue ?? 0) >= 10
      ? "overloaded"
      : dm.utilizationRate >= 2.0 || (extracted.avg_cycle_days ?? 0) >= (extracted.target_cycle_days ?? 8)
        ? "watch"
        : "healthy";

  const confidence: TeamCapacityInsight["summary"]["confidence"] =
    completenessPct >= 95 ? "high" : completenessPct >= 75 ? "medium" : "low";

  const teamLabel = extracted.team_name || "The team";
  const weekLabel = extracted.reporting_week ? ` (${extracted.reporting_week})` : "";

  const allocationNarrative = [
    `${teamLabel}${weekLabel} is ${capacityState} at ${dm.utilizationRate}× utilization — ${dm.effectiveFte} effective FTE against ${extracted.in_flight_work_items ?? 0} in-flight items.`,
    `Urgent queue stands at ${extracted.urgent_queue ?? "n/a"} with avg cycle time ${extracted.avg_cycle_days ?? "n/a"} days${extracted.target_cycle_days != null ? ` vs ${extracted.target_cycle_days}-day target (${dm.cycleVsTarget != null && dm.cycleVsTarget > 0 ? `+${dm.cycleVsTarget} days lagging` : "on target"})` : ""}.`,
    `Overtime is ${extracted.overtime_pct ?? "n/a"}% with ${extracted.specialist_gap_count ?? 0} specialist gap(s).${dm.slaBreachRatePct > 0 ? ` SLA breach rate: ${dm.slaBreachRatePct}% (${extracted.sla_breach_count} item(s)).` : ""}`,
    ...(dm.queueVelocityDelta > 0
      ? [`Intake of ${extracted.new_submissions_week ?? 0} new items this week is outpacing throughput by ${dm.queueVelocityDelta} items — backlog is accumulating.`]
      : []),
    ...(dm.capacityRunwayDays != null && dm.capacityRunwayDays < 10
      ? [`At current intake rate, the team will hit capacity ceiling in approximately ${dm.capacityRunwayDays} working day(s).`]
      : [])
  ];

  const rawActions: Array<{ priority: TeamCapacityInsight["actionPlan"][number]["priority"]; action: string }> = [];

  if ((extracted.sla_breach_count ?? 0) > 0) {
    rawActions.push({
      priority: "critical",
      action: `Escalate ${extracted.sla_breach_count} SLA-breached item(s) to ${teamLabel} lead for same-day disposition — breach rate is ${dm.slaBreachRatePct}%.`
    });
  }

  if ((extracted.urgent_queue ?? 0) >= 5) {
    rawActions.push({
      priority: "critical",
      action: `Triage ${extracted.urgent_queue} urgent queue item(s) now — assign dedicated reviewer until queue drops below 5.`
    });
  }

  if ((extracted.referral_backlog ?? 0) > 0) {
    rawActions.push({
      priority: "high",
      action: `Clear ${extracted.referral_backlog} referral backlog item(s) before accepting new intake — assign dedicated referral reviewer today.`
    });
  }

  if ((extracted.absentee_count ?? 0) > 0) {
    rawActions.push({
      priority: "high",
      action: `Redistribute workload to cover ${extracted.absentee_count} absentee(s) — reassign highest-priority in-flight items across available ${dm.effectiveFte} FTE.`
    });
  }

  if ((extracted.specialist_gap_count ?? 0) > 0) {
    rawActions.push({
      priority: "high",
      action: `Address ${extracted.specialist_gap_count} specialist gap(s) — cross-train alternates or escalate to management for contract cover.`
    });
  }

  if (dm.cycleVsTarget != null && dm.cycleVsTarget > 0) {
    rawActions.push({
      priority: "normal",
      action: `Cycle time is ${dm.cycleVsTarget} day(s) above the ${extracted.target_cycle_days}-day target — review workflow bottlenecks and reduce handoff delays.`
    });
  }

  if (dm.queueVelocityDelta > 0) {
    rawActions.push({
      priority: "normal",
      action: `Intake is outpacing output by ${dm.queueVelocityDelta} item(s)/week — consider intake throttle or additional resource until backlog stabilises.`
    });
  }

  if ((extracted.overtime_pct ?? 0) >= 18) {
    rawActions.push({
      priority: "high",
      action: `Overtime at ${extracted.overtime_pct}% — authorise relief or reduce scope now to prevent burnout and error rate increase.`
    });
  }

  if (extracted.key_skill_note) {
    rawActions.push({
      priority: "normal",
      action: `Skill context: ${extracted.key_skill_note}`
    });
  }

  if (rawActions.length === 0) {
    rawActions.push({ priority: "normal", action: "All capacity signals within normal parameters — maintain current allocation rhythm." });
  }

  const priorityOrder = { critical: 0, high: 1, normal: 2 };
  const actionPlan = rawActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 7);

  const queryTokens = parsed.question.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const promptHits = [...allocationNarrative, ...actionPlan.map((a) => a.action)].filter((line) =>
    queryTokens.some((token) => line.toLowerCase().includes(token))
  );

  const whitespaceRows: TeamCapacityWhitespaceRow[] = (Object.keys(wordingMap) as Array<keyof TeamCapacityFields>).map((field) => {
    const value = extracted[field];
    return {
      fieldWording: wordingMap[field],
      extractedValue: value == null ? "" : String(value),
      status: value == null || value === "" ? "MISSING" : "EXTRACTED",
      optional: optionalFields.has(field)
    };
  });

  return {
    summary: { completenessPct, capacityState, confidence, warnings: warnings.length },
    derived: dm,
    extractedFields: extracted,
    allocationNarrative,
    actionPlan,
    promptHits,
    warnings,
    whitespaceRows
  };
}

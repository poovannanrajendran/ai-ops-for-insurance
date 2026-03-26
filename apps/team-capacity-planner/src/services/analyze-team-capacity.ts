import { z } from "zod";

import type { TeamCapacityFields, TeamCapacityInsight, TeamCapacityWhitespaceRow } from "@/types/team-capacity";

const requestSchema = z.object({
  capacityText: z.string().min(20),
  sourceLabel: z.string().min(3),
  question: z.string().min(6)
});

const numericFields = [
  "team_size",
  "available_capacity_fte",
  "in_flight_work_items",
  "avg_cycle_days",
  "urgent_queue",
  "specialist_gap_count",
  "overtime_pct"
] as const;

const wordingMap: Record<keyof TeamCapacityFields, string> = {
  team_size: "Team size",
  available_capacity_fte: "Available capacity (FTE)",
  in_flight_work_items: "In-flight work items",
  avg_cycle_days: "Average cycle days",
  urgent_queue: "Urgent queue",
  specialist_gap_count: "Specialist gap count",
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

export function analyzeTeamCapacity(input: unknown): TeamCapacityInsight {
  const parsed = requestSchema.parse(input);
  const payload = parsePayload(parsed.capacityText);

  const extracted: TeamCapacityFields = {
    team_size: toNumber(payload.team_size),
    available_capacity_fte: toNumber(payload.available_capacity_fte),
    in_flight_work_items: toNumber(payload.in_flight_work_items),
    avg_cycle_days: toNumber(payload.avg_cycle_days),
    urgent_queue: toNumber(payload.urgent_queue),
    specialist_gap_count: toNumber(payload.specialist_gap_count),
    overtime_pct: toNumber(payload.overtime_pct),
    key_skill_note: payload.key_skill_note ?? ""
  };

  const missing = numericFields.filter((field) => extracted[field] == null);
  const denominator = numericFields.length + 1;
  const completeness = denominator - missing.length - (extracted.key_skill_note ? 0 : 1);
  const completenessPct = Math.max(0, Math.round((completeness / denominator) * 100));

  const warnings: string[] = [];
  if (missing.length) warnings.push(`Missing required numeric fields: ${missing.join(", ")}.`);
  if ((extracted.urgent_queue ?? 0) >= 10) warnings.push("Urgent queue is elevated and requires allocation control.");
  if ((extracted.overtime_pct ?? 0) >= 18) warnings.push("Overtime exceeds 18%; burnout risk is increasing.");
  if ((extracted.specialist_gap_count ?? 0) > 0) warnings.push("Specialist coverage gaps detected in critical workflows.");

  const capacityState: TeamCapacityInsight["summary"]["capacityState"] =
    (extracted.urgent_queue ?? 0) >= 10 || (extracted.overtime_pct ?? 0) >= 18 || (extracted.available_capacity_fte ?? 0) < 9
      ? "overloaded"
      : (extracted.urgent_queue ?? 0) >= 6 || (extracted.avg_cycle_days ?? 0) >= 8
        ? "watch"
        : "healthy";

  const confidence: TeamCapacityInsight["summary"]["confidence"] =
    completenessPct >= 95 ? "high" : completenessPct >= 75 ? "medium" : "low";

  const allocationNarrative = [
    `Current state is ${capacityState} with ${(extracted.available_capacity_fte ?? 0).toLocaleString("en-GB")} FTE available against ${(extracted.in_flight_work_items ?? 0).toLocaleString("en-GB")} in-flight items.`,
    `Urgent queue is ${extracted.urgent_queue ?? "n/a"} and average cycle time is ${extracted.avg_cycle_days ?? "n/a"} days.`,
    `Overtime is ${extracted.overtime_pct ?? "n/a"}% with specialist gap count at ${extracted.specialist_gap_count ?? "n/a"}.`
  ];

  const actionPlan = [
    `Rebalance queue ownership and protect urgent intake windows for the next 5 business days.`,
    `Cross-train backup reviewers for specialist queues and publish rota adjustments by end of day.`,
    extracted.key_skill_note ? `Skill context: ${extracted.key_skill_note}` : "No skill note supplied in the source pack."
  ];

  const queryTokens = parsed.question.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const promptHits = [...allocationNarrative, ...actionPlan].filter((line) =>
    queryTokens.some((token) => line.toLowerCase().includes(token))
  );

  const whitespaceRows: TeamCapacityWhitespaceRow[] = (Object.keys(wordingMap) as Array<keyof TeamCapacityFields>).map((field) => {
    const value = extracted[field];
    return {
      fieldWording: wordingMap[field],
      extractedValue: value == null ? "" : String(value),
      status: value == null || value === "" ? "MISSING" : "EXTRACTED"
    };
  });

  return {
    summary: { completenessPct, capacityState, confidence },
    extractedFields: extracted,
    allocationNarrative,
    actionPlan,
    promptHits,
    warnings,
    whitespaceRows
  };
}

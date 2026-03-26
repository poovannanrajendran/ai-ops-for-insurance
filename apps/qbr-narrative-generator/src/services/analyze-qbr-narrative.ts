import { z } from "zod";

import type { QbrInputFields, QbrNarrativeInsight, QbrWhitespaceRow } from "@/types/qbr-narrative";

const requestSchema = z.object({
  qbrText: z.string().min(20),
  sourceLabel: z.string().min(3),
  question: z.string().min(6)
});

const numericFields = [
  "gwp_gbp",
  "loss_ratio_pct",
  "ntu_rate_pct",
  "combined_ratio_pct",
  "premium_delta_pct",
  "renewal_retention_pct",
  "open_claims_count",
  "large_loss_count",
  "new_business_gwp_gbp"
] as const;

const optionalFields = new Set<string>(["large_loss_count", "new_business_gwp_gbp", "market_conditions_note"]);

const wordingMap: Record<keyof QbrInputFields, string> = {
  company_name: "Company / division",
  class_of_business: "Class of business",
  quarter: "Quarter",
  gwp_gbp: "Gross written premium (GBP)",
  loss_ratio_pct: "Loss ratio %",
  ntu_rate_pct: "NTU rate %",
  combined_ratio_pct: "Combined ratio %",
  premium_delta_pct: "Premium delta %",
  renewal_retention_pct: "Renewal retention %",
  open_claims_count: "Open claims count",
  large_loss_count: "Large loss count",
  new_business_gwp_gbp: "New business GWP (GBP)",
  broker_mix_note: "Broker mix note",
  market_conditions_note: "Market conditions note"
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
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function confidence(completenessPct: number): "high" | "medium" | "low" {
  if (completenessPct >= 95) return "high";
  if (completenessPct >= 75) return "medium";
  return "low";
}

export function analyzeQbrNarrative(input: unknown): QbrNarrativeInsight {
  const parsed = requestSchema.parse(input);
  const payload = parsePayload(parsed.qbrText);

  const extracted: QbrInputFields = {
    company_name: payload.company_name ?? "",
    class_of_business: payload.class_of_business ?? "",
    quarter: payload.quarter ?? "",
    gwp_gbp: toNumber(payload.gwp_gbp),
    loss_ratio_pct: toNumber(payload.loss_ratio_pct),
    ntu_rate_pct: toNumber(payload.ntu_rate_pct),
    combined_ratio_pct: toNumber(payload.combined_ratio_pct),
    premium_delta_pct: toNumber(payload.premium_delta_pct),
    renewal_retention_pct: toNumber(payload.renewal_retention_pct),
    open_claims_count: toNumber(payload.open_claims_count),
    large_loss_count: toNumber(payload.large_loss_count),
    new_business_gwp_gbp: toNumber(payload.new_business_gwp_gbp),
    broker_mix_note: payload.broker_mix_note ?? "",
    market_conditions_note: payload.market_conditions_note ?? ""
  };

  const missing = numericFields.filter((field) => extracted[field] == null);
  const textFields = ["company_name", "class_of_business", "quarter", "broker_mix_note", "market_conditions_note"] as const;
  const missingText = textFields.filter((f) => !extracted[f]);
  const denominator = numericFields.length + textFields.length;
  const completeness = denominator - missing.length - missingText.length;
  const completenessPct = Math.max(0, Math.round((completeness / denominator) * 100));

  const warnings: string[] = [];
  if (!extracted.company_name) warnings.push("Company name not provided — add company_name to identify the reporting entity.");
  if (missing.length) warnings.push(`Missing numeric fields: ${missing.join(", ")}.`);
  if ((extracted.combined_ratio_pct ?? 0) > 102) warnings.push("Combined ratio is above 102%, indicating underwriting pressure.");
  if ((extracted.renewal_retention_pct ?? 100) < 75) warnings.push("Renewal retention below 75%; include distribution recovery actions.");
  if ((extracted.premium_delta_pct ?? 0) < 0) warnings.push("Premium trend is negative versus prior period.");

  const state: QbrNarrativeInsight["summary"]["performanceState"] =
    (extracted.combined_ratio_pct ?? 100) > 102 || (extracted.loss_ratio_pct ?? 0) > 68
      ? "deteriorating"
      : (extracted.premium_delta_pct ?? 0) >= 5 && (extracted.loss_ratio_pct ?? 100) < 60
        ? "improving"
        : "stable";

  const companyPrefix = extracted.company_name ? `${extracted.company_name} — ` : "";
  const cobSuffix = extracted.class_of_business ? ` (${extracted.class_of_business})` : "";
  const quarterSuffix = extracted.quarter ? ` for ${extracted.quarter}` : "";

  const executiveNarrative = [
    `${companyPrefix}${state.charAt(0).toUpperCase() + state.slice(1)} performance profile recorded${quarterSuffix}${cobSuffix} with GBP ${(extracted.gwp_gbp ?? 0).toLocaleString("en-GB")} GWP.`,
    `Loss ratio stands at ${extracted.loss_ratio_pct ?? "n/a"}% and combined ratio at ${extracted.combined_ratio_pct ?? "n/a"}%.`,
    `Renewal retention is ${extracted.renewal_retention_pct ?? "n/a"}% with premium delta ${extracted.premium_delta_pct ?? "n/a"}% versus prior period.`,
    ...(extracted.new_business_gwp_gbp != null
      ? [`New business contributed GBP ${extracted.new_business_gwp_gbp.toLocaleString("en-GB")} GWP this quarter.`]
      : [])
  ];

  const boardTalkingPoints = [
    `Highlight NTU rate of ${extracted.ntu_rate_pct ?? "n/a"}% and its effect on margin resilience.`,
    `Open claims count at ${extracted.open_claims_count ?? "n/a"}${extracted.large_loss_count != null ? `; ${extracted.large_loss_count} large loss(es) active` : ""}. Confirm large-loss tracking cadence.`,
    extracted.broker_mix_note ? `Broker mix: ${extracted.broker_mix_note}` : "Broker mix context not supplied in source pack.",
    extracted.market_conditions_note ? `Market context: ${extracted.market_conditions_note}` : "Market conditions not provided — include in board commentary."
  ];

  const queryTokens = parsed.question.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const queryHits = [...executiveNarrative, ...boardTalkingPoints].filter((line) =>
    queryTokens.some((token) => line.toLowerCase().includes(token))
  );

  const whitespaceRows: QbrWhitespaceRow[] = (Object.keys(wordingMap) as Array<keyof QbrInputFields>).map((field) => {
    const value = extracted[field];
    return {
      fieldWording: wordingMap[field],
      extractedValue: value == null ? "" : String(value),
      status: value == null || value === "" ? "MISSING" : "EXTRACTED",
      optional: optionalFields.has(field)
    };
  });

  return {
    summary: {
      completenessPct,
      performanceState: state,
      narrativeConfidence: confidence(completenessPct)
    },
    extractedFields: extracted,
    executiveNarrative,
    boardTalkingPoints,
    promptHits: queryHits,
    warnings,
    whitespaceRows
  };
}

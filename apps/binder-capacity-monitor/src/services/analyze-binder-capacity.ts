import type {
  BinderInsight,
  BinderRow,
  BinderWarning,
  BreakdownMetric,
  TopRiskMetric
} from "@/types/binder-capacity";

interface ParseResult {
  errors: string[];
  rows: BinderRow[];
}

const requiredHeaders = [
  "risk_id",
  "insured_name",
  "binder_name",
  "class_of_business",
  "territory",
  "bound_amount_gbp",
  "binder_capacity_gbp",
  "forecast_additional_gbp",
  "days_to_expiry",
  "status"
] as const;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseBinderCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    return {
      rows: [],
      errors: ["Provide at least one header row and two data rows."]
    };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [`Missing required column(s): ${missingHeaders.join(", ")}.`]
    };
  }

  const rows: BinderRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));
    const rowNumber = lineIndex + 1;

    const riskId = compact(record.risk_id ?? "");
    const insuredName = compact(record.insured_name ?? "");
    const binderName = compact(record.binder_name ?? "");
    const classOfBusiness = compact(record.class_of_business ?? "");
    const territory = compact(record.territory ?? "");
    const status = compact(record.status ?? "");
    const boundAmountGbp = Number(record.bound_amount_gbp);
    const binderCapacityGbp = Number(record.binder_capacity_gbp);
    const forecastAdditionalGbp = Number(record.forecast_additional_gbp);
    const daysToExpiry = Number(record.days_to_expiry);

    if (
      !riskId ||
      !insuredName ||
      !binderName ||
      !classOfBusiness ||
      !territory ||
      !status ||
      Number.isNaN(boundAmountGbp) ||
      Number.isNaN(binderCapacityGbp) ||
      Number.isNaN(forecastAdditionalGbp) ||
      Number.isNaN(daysToExpiry)
    ) {
      errors.push(`Row ${rowNumber} has invalid required values.`);
      continue;
    }

    if (boundAmountGbp < 0 || binderCapacityGbp <= 0 || forecastAdditionalGbp < 0 || daysToExpiry < 0) {
      errors.push(`Row ${rowNumber} has negative or zero-only capacity metrics.`);
      continue;
    }

    rows.push({
      riskId,
      insuredName,
      binderName,
      classOfBusiness,
      territory,
      boundAmountGbp,
      binderCapacityGbp,
      forecastAdditionalGbp,
      daysToExpiry,
      status
    });
  }

  return { rows, errors };
}

function getBand(usedPct: number): "green" | "amber" | "red" {
  if (usedPct >= 90) {
    return "red";
  }
  if (usedPct >= 75) {
    return "amber";
  }
  return "green";
}

function getBreachRisk(usedPct: number, forecastUsedPct: number): "stable" | "watch" | "near_breach" | "likely_breach" | "breached" {
  if (usedPct >= 100) {
    return "breached";
  }
  if (forecastUsedPct >= 100) {
    return "likely_breach";
  }
  if (forecastUsedPct >= 90) {
    return "near_breach";
  }
  if (usedPct >= 85 || forecastUsedPct >= 85) {
    return "watch";
  }
  return "stable";
}

function roundPct(value: number): number {
  return Number(value.toFixed(1));
}

function aggregateBreakdown(
  rows: BinderRow[],
  totalBound: number,
  totalForecast: number,
  key: (row: BinderRow) => string
): BreakdownMetric[] {
  const map = new Map<string, { amount: number; forecastAmount: number }>();

  for (const row of rows) {
    const label = key(row);
    const previous = map.get(label) ?? { amount: 0, forecastAmount: 0 };
    map.set(label, {
      amount: previous.amount + row.boundAmountGbp,
      forecastAmount: previous.forecastAmount + row.boundAmountGbp + row.forecastAdditionalGbp
    });
  }

  return [...map.entries()]
    .sort((left, right) => right[1].amount - left[1].amount)
    .map(([label, values]) => ({
      label,
      amountGbp: values.amount,
      sharePct: roundPct((values.amount / totalBound) * 100),
      forecastAmountGbp: values.forecastAmount,
      forecastSharePct: roundPct((values.forecastAmount / totalForecast) * 100)
    }));
}

function buildTopRisks(rows: BinderRow[], totalBound: number): TopRiskMetric[] {
  return [...rows]
    .sort((left, right) => right.boundAmountGbp + right.forecastAdditionalGbp - (left.boundAmountGbp + left.forecastAdditionalGbp))
    .slice(0, 5)
    .map((row) => ({
      riskId: row.riskId,
      insuredName: row.insuredName,
      classOfBusiness: row.classOfBusiness,
      territory: row.territory,
      boundAmountGbp: row.boundAmountGbp,
      forecastExposureGbp: row.boundAmountGbp + row.forecastAdditionalGbp,
      sharePct: roundPct((row.boundAmountGbp / totalBound) * 100),
      daysToExpiry: row.daysToExpiry,
      status: row.status
    }));
}

function buildWarnings(
  capacity: number,
  totalBound: number,
  totalForecast: number,
  classBreakdown: BreakdownMetric[],
  territoryBreakdown: BreakdownMetric[]
): BinderWarning[] {
  const warnings: BinderWarning[] = [];
  const usedPct = (totalBound / capacity) * 100;
  const forecastUsedPct = (totalForecast / capacity) * 100;

  if (usedPct >= 100) {
    warnings.push({
      code: "current_breach",
      message: "Current written positions already exceed delegated binder capacity. Freeze new binds until capacity is reset."
    });
  }

  if (forecastUsedPct >= 100) {
    warnings.push({
      code: "forecast_breach",
      message: "Quoted pipeline pushes the binder above capacity on forecast. Reallocate or pause referral approvals."
    });
  }

  if (capacity - totalBound <= capacity * 0.15) {
    warnings.push({
      code: "low_headroom",
      message: "Remaining headroom is below 15% of binder capacity. Tighten referral and aggregation controls."
    });
  }

  if ((classBreakdown[0]?.sharePct ?? 0) >= 45 || (territoryBreakdown[0]?.sharePct ?? 0) >= 45) {
    warnings.push({
      code: "concentration",
      message: "Top class or territory concentration exceeds 45% of current bound volume. Check delegated concentration wording."
    });
  }

  return warnings;
}

function buildQueryHits(rows: BinderRow[], classBreakdown: BreakdownMetric[], territoryBreakdown: BreakdownMetric[], question?: string | null): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/\W+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (tokens.length === 0) {
    return [];
  }

  const lines = [
    ...rows.map(
      (row) =>
        `${row.riskId} ${row.insuredName} ${row.classOfBusiness} ${row.territory} bound ${row.boundAmountGbp.toLocaleString("en-GB")} forecast ${row.forecastAdditionalGbp.toLocaleString("en-GB")}`
    ),
    ...classBreakdown.map((item) => `Class ${item.label} currently uses ${item.sharePct}% of binder capacity consumption.`),
    ...territoryBreakdown.map((item) => `Territory ${item.label} currently uses ${item.sharePct}% of binder capacity consumption.`)
  ];

  return lines.filter((line) => tokens.some((token) => line.toLowerCase().includes(token))).slice(0, 5);
}

export function analyzeBinderCapacityCsv(csvText: string, question?: string | null): BinderInsight {
  const parsed = parseBinderCsv(csvText);

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]);
  }

  const rows = parsed.rows;
  const binderName = rows[0]?.binderName ?? "Unnamed binder";
  const capacities = new Set(rows.map((row) => row.binderCapacityGbp));

  if (capacities.size !== 1) {
    throw new Error("All rows must share the same binder_capacity_gbp value for a single binder run.");
  }

  const capacity = rows[0].binderCapacityGbp;
  const totalBound = rows.reduce((sum, row) => sum + row.boundAmountGbp, 0);
  const totalForecast = rows.reduce((sum, row) => sum + row.boundAmountGbp + row.forecastAdditionalGbp, 0);
  const usedPct = roundPct((totalBound / capacity) * 100);
  const forecastUsedPct = roundPct((totalForecast / capacity) * 100);
  const classBreakdown = aggregateBreakdown(rows, totalBound, totalForecast, (row) => row.classOfBusiness);
  const territoryBreakdown = aggregateBreakdown(rows, totalBound, totalForecast, (row) => row.territory);
  const warnings = buildWarnings(capacity, totalBound, totalForecast, classBreakdown, territoryBreakdown);
  const topRisks = buildTopRisks(rows, totalBound);
  const breachRisk = getBreachRisk(usedPct, forecastUsedPct);

  return {
    summary: {
      binderName,
      rowCount: rows.length,
      capacityGbp: capacity,
      usedGbp: totalBound,
      remainingGbp: capacity - totalBound,
      usedPct,
      forecastUsedGbp: totalForecast,
      forecastRemainingGbp: capacity - totalForecast,
      forecastUsedPct,
      currentBand: getBand(usedPct),
      forecastBand: getBand(forecastUsedPct),
      breachRisk
    },
    warnings,
    classBreakdown,
    territoryBreakdown,
    topRisks,
    queryHits: buildQueryHits(rows, classBreakdown, territoryBreakdown, question),
    commentary: {
      executiveSummary: `${binderName} is ${usedPct}% utilized today and ${forecastUsedPct}% utilized on forecast. Breach risk is ${breachRisk.replace(/_/g, " ")}.`,
      observations: [
        `${classBreakdown[0]?.label ?? "N/A"} is the largest class concentration at ${classBreakdown[0]?.sharePct ?? 0}% of bound volume.`,
        `${territoryBreakdown[0]?.label ?? "N/A"} is the largest territory concentration at ${territoryBreakdown[0]?.sharePct ?? 0}% of bound volume.`,
        `${topRisks[0]?.insuredName ?? "N/A"} is the largest single risk at GBP ${topRisks[0]?.boundAmountGbp.toLocaleString("en-GB") ?? "0"}.`
      ],
      actions: warnings.length > 0
        ? [
            "Review top class and territory concentrations against delegated authority wording.",
            "Restrict new binds or redirect quotes if forecast utilization remains above amber thresholds.",
            "Escalate the largest forecast risks for same-day capacity sign-off before release."
          ]
        : [
            "Capacity remains within tolerance. Continue routine monitoring against class and territory mix.",
            "Track quoted pipeline daily to prevent avoidable threshold drift."
          ]
    }
  };
}

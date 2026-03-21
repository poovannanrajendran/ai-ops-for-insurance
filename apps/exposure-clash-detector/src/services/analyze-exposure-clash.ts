import type {
  ClashFinding,
  ConcentrationMetric,
  ExposureClashInsight,
  ExposureRow
} from "@/types/exposure-clash";

const requiredHeaders = [
  "schedule_id",
  "policy_id",
  "insured_name",
  "location",
  "country",
  "peril",
  "period_start",
  "period_end",
  "tiv_gbp",
  "limit_gbp"
] as const;

interface ParseResult {
  rows: ExposureRow[];
  errors: string[];
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
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
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function overlapDays(startA: string, endA: string, startB: string, endB: string): number {
  const from = new Date(Math.max(new Date(startA).getTime(), new Date(startB).getTime()));
  const to = new Date(Math.min(new Date(endA).getTime(), new Date(endB).getTime()));
  const diff = to.getTime() - from.getTime();
  if (Number.isNaN(diff) || diff < 0) {
    return 0;
  }
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseExposureSchedules(schedulesText: string): ParseResult {
  const lines = schedulesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) {
    return {
      rows: [],
      errors: ["Provide at least one header row and three data rows."]
    };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}.`] };
  }

  const rows: ExposureRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));
    const rowNumber = lineIndex + 1;

    const tivGbp = Number((record.tiv_gbp ?? "").replace(/,/g, ""));
    const limitGbp = Number((record.limit_gbp ?? "").replace(/,/g, ""));

    const row: ExposureRow = {
      scheduleId: (record.schedule_id ?? "").trim(),
      policyId: (record.policy_id ?? "").trim(),
      insuredName: (record.insured_name ?? "").trim(),
      location: (record.location ?? "").trim(),
      country: (record.country ?? "").trim(),
      peril: (record.peril ?? "").trim(),
      periodStart: (record.period_start ?? "").trim(),
      periodEnd: (record.period_end ?? "").trim(),
      tivGbp,
      limitGbp
    };

    const invalid =
      !row.scheduleId ||
      !row.policyId ||
      !row.insuredName ||
      !row.location ||
      !row.country ||
      !row.peril ||
      !row.periodStart ||
      !row.periodEnd ||
      Number.isNaN(row.tivGbp) ||
      Number.isNaN(row.limitGbp);

    if (invalid) {
      errors.push(`Row ${rowNumber} has invalid required values.`);
      continue;
    }

    rows.push(row);
  }

  return { rows, errors };
}

function aggregateConcentration(
  clashes: ClashFinding[],
  getLabel: (clash: ClashFinding) => string
): ConcentrationMetric[] {
  const map = new Map<string, { clashCount: number; totalCombinedTivGbp: number }>();
  for (const clash of clashes) {
    const label = getLabel(clash);
    const current = map.get(label) ?? { clashCount: 0, totalCombinedTivGbp: 0 };
    map.set(label, {
      clashCount: current.clashCount + 1,
      totalCombinedTivGbp: current.totalCombinedTivGbp + clash.combinedTivGbp
    });
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((left, right) => right.totalCombinedTivGbp - left.totalCombinedTivGbp);
}

function buildQueryHits(clashes: ClashFinding[], warnings: string[], question?: string): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  if (tokens.length === 0) {
    return [];
  }

  const lines = [
    ...clashes.map(
      (clash) =>
        `${clash.country} ${clash.peril} clash: combined TIV GBP ${clash.combinedTivGbp.toLocaleString("en-GB")}, severity ${clash.severity}`
    ),
    ...warnings
  ];

  const hits: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (tokens.some((token) => lower.includes(token))) {
      hits.push(line);
    }
    if (hits.length >= 6) {
      break;
    }
  }

  return hits;
}

export function analyzeExposureClash(
  schedulesText: string,
  question?: string
): { scheduleCount: number; insight: ExposureClashInsight; validationErrors: string[] } {
  const parsed = parseExposureSchedules(schedulesText);
  if (parsed.errors.length > 0) {
    return {
      scheduleCount: 0,
      validationErrors: parsed.errors,
      insight: {
        summary: { totalRows: 0, schedulesDetected: 0, clashesDetected: 0, highSeverityClashes: 0 },
        clashes: [],
        countryConcentration: [],
        perilConcentration: [],
        warnings: [],
        queryHits: [],
        commentary: "Validation failed."
      }
    };
  }

  const rows = parsed.rows;
  const schedules = new Set(rows.map((row) => row.scheduleId));
  const clashes: ClashFinding[] = [];

  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const left = rows[leftIndex];
      const right = rows[rightIndex];

      if (left.scheduleId === right.scheduleId) continue;
      if (normalise(left.insuredName) !== normalise(right.insuredName)) continue;
      if (normalise(left.location) !== normalise(right.location)) continue;
      if (normalise(left.peril) !== normalise(right.peril)) continue;

      const overlap = overlapDays(left.periodStart, left.periodEnd, right.periodStart, right.periodEnd);
      if (overlap <= 0) continue;

      const combinedTivGbp = left.tivGbp + right.tivGbp;
      const combinedLimitGbp = left.limitGbp + right.limitGbp;
      const severity: "medium" | "high" =
        combinedTivGbp >= 10000000 || combinedLimitGbp >= 6000000 ? "high" : "medium";

      clashes.push({
        clashId: `${left.scheduleId}-${right.scheduleId}-${left.policyId}-${right.policyId}`,
        schedulePair: `${left.scheduleId} vs ${right.scheduleId}`,
        policyPair: `${left.policyId} vs ${right.policyId}`,
        insuredName: left.insuredName,
        location: left.location,
        country: left.country,
        peril: left.peril,
        overlapDays: overlap,
        combinedTivGbp,
        combinedLimitGbp,
        severity,
        rationale:
          severity === "high"
            ? "Overlapping schedules with high combined TIV/limit require immediate exposure coordination."
            : "Overlap detected across schedules; review aggregate positioning and policy boundary clarity."
      });
    }
  }

  clashes.sort((left, right) => right.combinedTivGbp - left.combinedTivGbp);

  const countryConcentration = aggregateConcentration(clashes, (clash) => clash.country);
  const perilConcentration = aggregateConcentration(clashes, (clash) => clash.peril);

  const warnings: string[] = [];
  if (clashes.length === 0) {
    warnings.push("No cross-schedule clashes detected in this run.");
  } else {
    const highCount = clashes.filter((clash) => clash.severity === "high").length;
    if (highCount > 0) {
      warnings.push(`${highCount} high-severity clashes require underwriting and exposure management review.`);
    }
    if ((countryConcentration[0]?.totalCombinedTivGbp ?? 0) >= 15000000) {
      warnings.push("Top country clash concentration exceeds GBP 15,000,000 combined TIV.");
    }
  }

  const insight: ExposureClashInsight = {
    summary: {
      totalRows: rows.length,
      schedulesDetected: schedules.size,
      clashesDetected: clashes.length,
      highSeverityClashes: clashes.filter((clash) => clash.severity === "high").length
    },
    clashes,
    countryConcentration,
    perilConcentration,
    warnings,
    queryHits: [],
    commentary:
      clashes.length > 0
        ? `${clashes.length} clash(es) detected across ${schedules.size} schedule(s). Prioritise high-severity overlaps first.`
        : "No schedule clashes detected. Continue monitoring with each bordereaux refresh."
  };

  insight.queryHits = buildQueryHits(clashes, warnings, question);

  return { scheduleCount: schedules.size, validationErrors: [], insight };
}

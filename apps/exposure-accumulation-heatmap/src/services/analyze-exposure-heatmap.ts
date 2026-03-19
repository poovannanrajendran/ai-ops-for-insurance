import type {
  ConcentrationMetric,
  ExposureInsight,
  ExposureRow,
  ExposureWarning,
  HeatPoint,
  Hotspot
} from "@/types/exposure-heatmap";

interface ParseResult {
  errors: string[];
  rows: ExposureRow[];
}

const requiredHeaders = ["location_id", "latitude", "longitude", "country", "tiv"] as const;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
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

export function parseExposureCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["Provide at least one header row and one data row."]
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

  const rows: ExposureRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));

    const locationId = compact(record.location_id ?? "");
    const country = compact(record.country ?? "");
    const latitude = Number(record.latitude);
    const longitude = Number(record.longitude);
    const tiv = Number(record.tiv);

    const rowNumber = lineIndex + 1;

    if (!locationId || !country || Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(tiv)) {
      errors.push(`Row ${rowNumber} has invalid required values.`);
      continue;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      errors.push(`Row ${rowNumber} has out-of-range coordinates.`);
      continue;
    }

    if (tiv <= 0) {
      errors.push(`Row ${rowNumber} has non-positive TIV.`);
      continue;
    }

    rows.push({
      locationId,
      country,
      latitude,
      longitude,
      tiv,
      peril: compact(record.peril ?? "") || undefined
    });
  }

  return { rows, errors };
}

function topConcentrationByCountry(rows: ExposureRow[], totalTiv: number): ConcentrationMetric[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.country, (map.get(row.country) ?? 0) + row.tiv);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, tiv]) => ({
      label,
      totalTiv: tiv,
      sharePct: Number(((tiv / totalTiv) * 100).toFixed(1))
    }));
}

function buildHotspots(rows: ExposureRow[]): Hotspot[] {
  const countryMap = new Map<string, { locationCount: number; totalTiv: number }>();

  for (const row of rows) {
    const prev = countryMap.get(row.country) ?? { locationCount: 0, totalTiv: 0 };
    countryMap.set(row.country, {
      locationCount: prev.locationCount + 1,
      totalTiv: prev.totalTiv + row.tiv
    });
  }

  return [...countryMap.entries()]
    .sort((a, b) => b[1].totalTiv - a[1].totalTiv)
    .slice(0, 5)
    .map(([country, values], index) => ({
      rank: index + 1,
      country,
      locationCount: values.locationCount,
      totalTiv: values.totalTiv
    }));
}

function buildWarnings(
  rows: ExposureRow[],
  totalTiv: number,
  maxLocationTiv: number,
  concentration: ConcentrationMetric[]
): ExposureWarning[] {
  const warnings: ExposureWarning[] = [];

  if (rows.length < 5) {
    warnings.push({
      code: "low_data_density",
      message: "Fewer than 5 valid locations were provided; hotspot confidence is limited."
    });
  }

  const topCountry = concentration[0];
  if (topCountry && topCountry.sharePct >= 55) {
    warnings.push({
      code: "high_country_concentration",
      message: `${topCountry.label} accounts for ${topCountry.sharePct}% of TIV, indicating concentration risk.`
    });
  }

  if (maxLocationTiv / totalTiv >= 0.35) {
    warnings.push({
      code: "single_location_peak",
      message: "A single location contributes over 35% of portfolio TIV."
    });
  }

  return warnings;
}

function buildQueryHits(rows: ExposureRow[], question?: string | null): string[] {
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

  return rows
    .map((row) => `Location ${row.locationId} in ${row.country} with TIV ${row.tiv.toLocaleString("en-GB")}.`)
    .filter((line) => tokens.some((token) => line.toLowerCase().includes(token)))
    .slice(0, 5);
}

export function analyzeExposureCsv(csvText: string, question?: string | null): ExposureInsight {
  const parsed = parseExposureCsv(csvText);

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]);
  }

  const rows = parsed.rows;
  const totalTiv = rows.reduce((sum, row) => sum + row.tiv, 0);
  const maxLocationTiv = rows.reduce((max, row) => Math.max(max, row.tiv), 0);
  const concentration = topConcentrationByCountry(rows, totalTiv);
  const hotspots = buildHotspots(rows);

  const heatPoints: HeatPoint[] = rows.map((row) => ({
    locationId: row.locationId,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    tiv: row.tiv,
    intensity: Number((row.tiv / maxLocationTiv).toFixed(3))
  }));

  const warnings = buildWarnings(rows, totalTiv, maxLocationTiv, concentration);

  const commentary = {
    executiveSummary: `Processed ${rows.length} location(s) with total TIV ${totalTiv.toLocaleString("en-GB")}. ${warnings.length} warning(s) flagged.`,
    observations: [
      `Top concentration: ${concentration[0]?.label ?? "N/A"} (${concentration[0]?.sharePct ?? 0}% share).`,
      `Largest single-location TIV: ${maxLocationTiv.toLocaleString("en-GB")}.`,
      `Hotspots identified: ${hotspots.length}.`
    ],
    actions: warnings.length
      ? [
          "Escalate top concentration zones for accumulation review.",
          "Validate limits, CAT controls, and reinsurance protections for peak clusters."
        ]
      : ["No immediate concentration breach; continue standard accumulation monitoring."]
  };

  return {
    summary: {
      rowCount: rows.length,
      totalTiv,
      maxLocationTiv,
      hotspotCount: hotspots.length
    },
    heatPoints,
    hotspots,
    countryConcentration: concentration,
    warnings,
    commentary,
    queryHits: buildQueryHits(rows, question)
  };
}

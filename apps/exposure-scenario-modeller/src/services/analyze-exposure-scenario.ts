import type {
  ConcentrationInsight,
  ExposureScenarioAnalysis,
  ExposureScenarioRow,
  QuerySnippet,
  RequiredFieldGate,
  RequiredFieldStatus,
  ScenarioResult
} from "@/types/exposure-scenario";

const requiredHeaders = [
  "exposure_id",
  "account_name",
  "country",
  "peril",
  "segment",
  "tiv_gbp",
  "attachment_gbp",
  "limit_gbp"
] as const;

const gateFields = ["account_name", "country", "peril", "segment", "tiv_gbp", "limit_gbp"] as const;

const perilBaseFactors: Record<string, number> = {
  cyber: 0.022,
  earthquake: 0.048,
  fire: 0.018,
  flood: 0.027,
  liability: 0.014,
  riot: 0.016,
  windstorm: 0.033
};

interface ParseResult {
  rows: ExposureScenarioRow[];
  errors: string[];
}

interface DimensionMetric {
  label: string;
  exposureCount: number;
  totalTivGbp: number;
  sharePct: number;
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function parseNumber(value: string): number | null {
  const cleaned = compact(value).replace(/,/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCase(value: string): string {
  return compact(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizePeril(value: string): string {
  const normalized = compact(value).toLowerCase();
  if (!normalized) return "Unknown";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function hasFieldValue(row: ExposureScenarioRow, fieldName: (typeof gateFields)[number]): boolean {
  switch (fieldName) {
    case "account_name":
      return Boolean(row.accountName);
    case "country":
      return Boolean(row.country);
    case "peril":
      return Boolean(row.peril);
    case "segment":
      return Boolean(row.segment);
    case "tiv_gbp":
      return typeof row.tivGbp === "number" && row.tivGbp > 0;
    case "limit_gbp":
      return typeof row.limitGbp === "number" && row.limitGbp > 0;
    default:
      return false;
  }
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function roundPct(value: number): number {
  return Number(value.toFixed(1));
}

function baseFactor(peril: string): number {
  return perilBaseFactors[peril.toLowerCase()] ?? 0.02;
}

function buildDimensionMetrics(
  rows: ExposureScenarioRow[],
  pickLabel: (row: ExposureScenarioRow) => string
): DimensionMetric[] {
  const totalTiv = rows.reduce((sum, row) => sum + (row.tivGbp ?? 0), 0);
  const map = new Map<string, { exposureCount: number; totalTivGbp: number }>();

  for (const row of rows) {
    const label = pickLabel(row);
    const current = map.get(label) ?? { exposureCount: 0, totalTivGbp: 0 };
    map.set(label, {
      exposureCount: current.exposureCount + 1,
      totalTivGbp: current.totalTivGbp + (row.tivGbp ?? 0)
    });
  }

  return [...map.entries()]
    .map(([label, value]) => ({
      label,
      exposureCount: value.exposureCount,
      totalTivGbp: roundMoney(value.totalTivGbp),
      sharePct: totalTiv > 0 ? roundPct((value.totalTivGbp / totalTiv) * 100) : 0
    }))
    .sort((left, right) => right.totalTivGbp - left.totalTivGbp);
}

function buildRequiredFieldGate(rows: ExposureScenarioRow[]): RequiredFieldGate {
  const totalRows = rows.length;
  const fields: RequiredFieldStatus[] = gateFields.map((fieldName) => {
    const matchedRows = rows.filter((row) => hasFieldValue(row, fieldName)).length;
    const coveragePct = totalRows === 0 ? 0 : roundPct((matchedRows / totalRows) * 100);

    return {
      fieldName,
      matchedRows,
      totalRows,
      coveragePct,
      status: matchedRows === totalRows && totalRows > 0 ? "matched" : "missing"
    };
  });

  const missingFields = fields.filter((field) => field.status === "missing").map((field) => field.fieldName);
  const fieldCoveragePct =
    fields.length === 0 ? 0 : roundPct(fields.reduce((sum, field) => sum + field.coveragePct, 0) / fields.length);

  return {
    passed: totalRows >= 3 && missingFields.length === 0,
    fieldCoveragePct,
    missingFields,
    fields,
    rationale:
      totalRows < 3
        ? "At least three exposure rows are required for deterministic scenario modelling."
        : missingFields.length > 0
          ? `Missing analytical coverage for: ${missingFields.join(", ")}.`
          : "Required analytical fields are complete across the uploaded exposure rows."
  };
}

function buildScenarioResults(rows: ExposureScenarioRow[]): {
  scenarios: ScenarioResult[];
  rowStressLosses: Map<string, number>;
} {
  const countryMetrics = buildDimensionMetrics(rows, (row) => row.country);
  const perilMetrics = buildDimensionMetrics(rows, (row) => row.peril);
  const segmentMetrics = buildDimensionMetrics(rows, (row) => row.segment);

  const countryShare = new Map(countryMetrics.map((metric) => [metric.label, metric.sharePct / 100]));
  const perilShare = new Map(perilMetrics.map((metric) => [metric.label, metric.sharePct / 100]));
  const segmentShare = new Map(segmentMetrics.map((metric) => [metric.label, metric.sharePct / 100]));

  const topCountry = countryMetrics[0];
  const topPeril = perilMetrics[0];
  const topSegment = segmentMetrics[0];

  const baselineConcentrationLoadPct = roundPct(
    (topCountry?.sharePct ?? 0) * 0.08 + (topSegment?.sharePct ?? 0) * 0.05
  );
  const stressedConcentrationLoadPct = roundPct(
    (topCountry?.sharePct ?? 0) * 0.16 + (topPeril?.sharePct ?? 0) * 0.14 + (topSegment?.sharePct ?? 0) * 0.09
  );

  let baselineGross = 0;
  let baselineNet = 0;
  let stressedGross = 0;
  let stressedNet = 0;
  let baselineAffected = 0;
  let stressedAffected = 0;
  const rowStressLosses = new Map<string, number>();

  for (const row of rows) {
    const tiv = row.tivGbp ?? 0;
    const limit = row.limitGbp ?? 0;
    const attachment = row.attachmentGbp ?? 0;
    const grossCap = limit + attachment;
    const perilFactor = baseFactor(row.peril);
    const rowCountryShare = countryShare.get(row.country) ?? 0;
    const rowPerilShare = perilShare.get(row.peril) ?? 0;
    const rowSegmentShare = segmentShare.get(row.segment) ?? 0;

    const baselineFactor = perilFactor * (1 + rowCountryShare * 0.18 + rowSegmentShare * 0.12);
    const stressedFactor =
      perilFactor * 1.85 + rowCountryShare * 0.028 + rowPerilShare * 0.024 + rowSegmentShare * 0.016;

    const rowBaselineGross = tiv * baselineFactor;
    const rowStressedGross = tiv * stressedFactor;
    const rowBaselineNet = Math.max(Math.min(rowBaselineGross, grossCap) - attachment, 0);
    const rowStressedNet = Math.max(Math.min(rowStressedGross, grossCap) - attachment, 0);

    baselineGross += rowBaselineGross;
    baselineNet += rowBaselineNet;
    stressedGross += rowStressedGross;
    stressedNet += rowStressedNet;

    if (rowBaselineNet > 0) baselineAffected += 1;
    if (rowStressedNet > 0) stressedAffected += 1;

    rowStressLosses.set(row.exposureId, rowStressedNet);
  }

  const totalLimit = rows.reduce((sum, row) => sum + (row.limitGbp ?? 0), 0);
  const topDriver = `${topCountry?.label ?? "N/A"} / ${topPeril?.label ?? "N/A"}`;

  const scenarios: ScenarioResult[] = [
    {
      scenarioId: "baseline",
      title: "Baseline accumulation view",
      grossModelledLossGbp: roundMoney(baselineGross),
      netModelledLossGbp: roundMoney(baselineNet),
      lossRatioPct: totalLimit > 0 ? roundPct((baselineNet / totalLimit) * 100) : 0,
      concentrationLoadPct: baselineConcentrationLoadPct,
      affectedExposureCount: baselineAffected,
      topDriver,
      commentary: `Baseline load stays anchored to peril factors with a mild uplift for ${topCountry?.label ?? "portfolio"} and ${topSegment?.label ?? "core segments"}.`
    },
    {
      scenarioId: "stressed",
      title: "Stressed concentration view",
      grossModelledLossGbp: roundMoney(stressedGross),
      netModelledLossGbp: roundMoney(stressedNet),
      lossRatioPct: totalLimit > 0 ? roundPct((stressedNet / totalLimit) * 100) : 0,
      concentrationLoadPct: stressedConcentrationLoadPct,
      affectedExposureCount: stressedAffected,
      topDriver,
      commentary: `Stress amplifies peril severity and concentration where ${topCountry?.label ?? "the top country"}, ${topPeril?.label ?? "the top peril"}, and ${topSegment?.label ?? "the top segment"} stack together.`
    }
  ];

  return { scenarios, rowStressLosses };
}

function buildConcentrationInsights(
  rows: ExposureScenarioRow[],
  rowStressLosses: Map<string, number>
): ConcentrationInsight[] {
  const totalTiv = rows.reduce((sum, row) => sum + (row.tivGbp ?? 0), 0);
  const groups: Array<{ dimension: ConcentrationInsight["dimension"]; metrics: DimensionMetric[] }> = [
    { dimension: "country", metrics: buildDimensionMetrics(rows, (row) => row.country).slice(0, 2) },
    { dimension: "peril", metrics: buildDimensionMetrics(rows, (row) => row.peril).slice(0, 2) },
    { dimension: "segment", metrics: buildDimensionMetrics(rows, (row) => row.segment).slice(0, 2) }
  ];

  return groups
    .flatMap(({ dimension, metrics }) =>
      metrics.map((metric) => {
        const stressedLossGbp = roundMoney(
          rows
            .filter((row) => {
              switch (dimension) {
                case "country":
                  return row.country === metric.label;
                case "peril":
                  return row.peril === metric.label;
                case "segment":
                  return row.segment === metric.label;
                default:
                  return false;
              }
            })
            .reduce((sum, row) => sum + (rowStressLosses.get(row.exposureId) ?? 0), 0)
        );

        return {
          dimension,
          label: metric.label,
          exposureCount: metric.exposureCount,
          totalTivGbp: metric.totalTivGbp,
          sharePct: totalTiv > 0 ? metric.sharePct : 0,
          stressedLossGbp,
          insight: `${metric.label} contributes ${metric.sharePct}% of TIV and ${stressedLossGbp.toLocaleString("en-GB")} GBP of stressed net loss.`
        };
      })
    )
    .sort((left, right) => right.stressedLossGbp - left.stressedLossGbp);
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function buildQuerySnippets(
  rows: ExposureScenarioRow[],
  concentrationInsights: ConcentrationInsight[],
  question?: string
): QuerySnippet[] {
  const topCountry = concentrationInsights.find((insight) => insight.dimension === "country");
  const topPeril = concentrationInsights.find((insight) => insight.dimension === "peril");
  const topSegment = concentrationInsights.find((insight) => insight.dimension === "segment");
  const requestedTokens = (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);

  const questionCountry = rows.find((row) => requestedTokens.includes(row.country.toLowerCase()));
  const questionPeril = rows.find((row) => requestedTokens.includes(row.peril.toLowerCase()));
  const snippetCountry = escapeSqlLiteral(questionCountry?.country ?? topCountry?.label ?? "United Kingdom");
  const snippetPeril = escapeSqlLiteral(questionPeril?.peril ?? topPeril?.label ?? "Flood");
  const snippetSegment = escapeSqlLiteral(topSegment?.label ?? "Property");

  const snippets: QuerySnippet[] = [
    {
      label: "Country concentration drill-down",
      snippet: [
        "SELECT country, SUM(tiv_gbp) AS total_tiv_gbp, SUM(limit_gbp) AS total_limit_gbp",
        "FROM portfolio_exposures",
        `WHERE country = '${snippetCountry}'`,
        "GROUP BY country;"
      ].join("\n"),
      rationale: "Use this to validate whether the top country concentration remains within accumulation tolerance."
    },
    {
      label: "Stressed peril watchlist",
      snippet: [
        "SELECT peril, COUNT(*) AS exposure_count, SUM(limit_gbp) AS total_limit_gbp",
        "FROM portfolio_exposures",
        `WHERE peril = '${snippetPeril}'`,
        "GROUP BY peril;"
      ].join("\n"),
      rationale: "Use this to isolate the peril driving the largest stressed scenario uplift."
    },
    {
      label: "Segment attachment review",
      snippet: [
        "SELECT segment, AVG(attachment_gbp) AS avg_attachment_gbp, SUM(limit_gbp) AS total_limit_gbp",
        "FROM portfolio_exposures",
        `WHERE segment = '${snippetSegment}'`,
        "GROUP BY segment;"
      ].join("\n"),
      rationale: "Use this to test whether attachment structure is consistent across the most concentrated segment."
    }
  ];

  if (requestedTokens.length > 0) {
    snippets.unshift({
      label: "Question focus filter",
      snippet: [
        "SELECT exposure_id, account_name, country, peril, segment, tiv_gbp, limit_gbp",
        "FROM portfolio_exposures",
        `WHERE LOWER(CONCAT(country, ' ', peril, ' ', segment, ' ', account_name)) LIKE '%${escapeSqlLiteral(requestedTokens[0])}%';`
      ].join("\n"),
      rationale: "Use this filter to align downstream QA with the user's prompt wording."
    });
  }

  return snippets.slice(0, 4);
}

export function parseExposureScenarioCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) {
    return {
      rows: [],
      errors: ["Provide at least one header row and three exposure rows."]
    };
  }

  const headers = splitCsvLine(lines[0]).map((header) => compact(header).toLowerCase());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [`Missing required column(s): ${missingHeaders.join(", ")}.`]
    };
  }

  const rows: ExposureScenarioRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));
    const exposureId = compact(record.exposure_id ?? "");

    if (!exposureId) {
      errors.push(`Row ${lineIndex + 1} is missing exposure_id.`);
      continue;
    }

    rows.push({
      exposureId,
      accountName: titleCase(record.account_name ?? ""),
      country: titleCase(record.country ?? ""),
      peril: normalizePeril(record.peril ?? ""),
      segment: titleCase(record.segment ?? ""),
      tivGbp: parseNumber(record.tiv_gbp ?? ""),
      attachmentGbp: parseNumber(record.attachment_gbp ?? "") ?? 0,
      limitGbp: parseNumber(record.limit_gbp ?? "")
    });
  }

  return { rows, errors };
}

export function analyzeExposureScenario(
  csvText: string,
  question?: string
): { analysis: ExposureScenarioAnalysis; validationErrors: string[] } {
  const parsed = parseExposureScenarioCsv(csvText);
  const gate = buildRequiredFieldGate(parsed.rows);

  if (parsed.errors.length > 0) {
    return {
      validationErrors: parsed.errors,
      analysis: {
        summary: {
          rowCount: 0,
          totalTivGbp: 0,
          totalLimitGbp: 0,
          gatePassed: false,
          baselineNetLossGbp: 0,
          stressedNetLossGbp: 0,
          stressDeltaPct: 0
        },
        requiredFieldGate: gate,
        scenarios: [],
        concentrationInsights: [],
        querySnippets: [],
        warnings: [],
        commentary: {
          executiveSummary: "Validation failed.",
          observations: [],
          actions: []
        }
      }
    };
  }

  if (!gate.passed) {
    return {
      validationErrors: [gate.rationale],
      analysis: {
        summary: {
          rowCount: parsed.rows.length,
          totalTivGbp: 0,
          totalLimitGbp: 0,
          gatePassed: false,
          baselineNetLossGbp: 0,
          stressedNetLossGbp: 0,
          stressDeltaPct: 0
        },
        requiredFieldGate: gate,
        scenarios: [],
        concentrationInsights: [],
        querySnippets: [],
        warnings: [],
        commentary: {
          executiveSummary: gate.rationale,
          observations: [],
          actions: []
        }
      }
    };
  }

  const totalTivGbp = parsed.rows.reduce((sum, row) => sum + (row.tivGbp ?? 0), 0);
  const totalLimitGbp = parsed.rows.reduce((sum, row) => sum + (row.limitGbp ?? 0), 0);
  const { scenarios, rowStressLosses } = buildScenarioResults(parsed.rows);
  const concentrationInsights = buildConcentrationInsights(parsed.rows, rowStressLosses);
  const querySnippets = buildQuerySnippets(parsed.rows, concentrationInsights, question);

  const baseline = scenarios.find((scenario) => scenario.scenarioId === "baseline");
  const stressed = scenarios.find((scenario) => scenario.scenarioId === "stressed");
  const stressDeltaPct =
    baseline && baseline.netModelledLossGbp > 0 && stressed
      ? roundPct(((stressed.netModelledLossGbp - baseline.netModelledLossGbp) / baseline.netModelledLossGbp) * 100)
      : 0;

  const warnings: string[] = [];
  if ((concentrationInsights[0]?.sharePct ?? 0) >= 45) {
    warnings.push(`Top concentration exceeds 45% of TIV (${concentrationInsights[0]?.label}).`);
  }
  if (stressDeltaPct >= 60) {
    warnings.push(`Stress uplift is ${stressDeltaPct}% over baseline, indicating limited diversification.`);
  }
  if ((stressed?.lossRatioPct ?? 0) >= 35) {
    warnings.push("Stressed scenario consumes more than 35% of aggregate stated limit.");
  }

  return {
    validationErrors: [],
    analysis: {
      summary: {
        rowCount: parsed.rows.length,
        totalTivGbp: roundMoney(totalTivGbp),
        totalLimitGbp: roundMoney(totalLimitGbp),
        gatePassed: gate.passed,
        baselineNetLossGbp: baseline?.netModelledLossGbp ?? 0,
        stressedNetLossGbp: stressed?.netModelledLossGbp ?? 0,
        stressDeltaPct
      },
      requiredFieldGate: gate,
      scenarios,
      concentrationInsights,
      querySnippets,
      warnings,
      commentary: {
        executiveSummary: `Modelled ${parsed.rows.length} exposure rows with ${roundMoney(totalTivGbp).toLocaleString("en-GB")} GBP of TIV. The stressed view lands ${stressDeltaPct}% above baseline.`,
        observations: [
          `${concentrationInsights[0]?.label ?? "Top concentration"} is the largest concentration driver at ${concentrationInsights[0]?.sharePct ?? 0}% of TIV.`,
          `Baseline net loss is ${(baseline?.netModelledLossGbp ?? 0).toLocaleString("en-GB")} GBP versus ${(stressed?.netModelledLossGbp ?? 0).toLocaleString("en-GB")} GBP stressed.`,
          `${querySnippets.length} query snippet(s) were prepared for downstream drill-down.`
        ],
        actions:
          warnings.length > 0
            ? [
                "Review top country and peril concentrations against accumulation appetite.",
                "Validate whether attachment levels in concentrated segments remain defensible under stress."
              ]
            : ["No immediate concentration breach was flagged; continue routine scenario monitoring."]
      }
    }
  };
}

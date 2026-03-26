import type { OpsHealthInsight, OpsMetric, Severity } from "@/types/ops-health";

const REQUIRED_COLUMNS = ["kpi", "current", "target", "previous", "owner", "direction"] as const;

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

interface ParsedRow {
  kpi: string;
  current: number;
  target: number;
  previous: number;
  owner: string;
  direction: "higher_better" | "lower_better";
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function parseKpis(kpiText: string) {
  const lines = kpiText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { missing: ["kpi rows"], rows: [] as ParsedRow[] };
  }

  const header = splitCsvLine(lines[0]).map((col) => col.toLowerCase());
  const headerMap = new Map<string, number>(header.map((col, index) => [col, index]));

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headerMap.has(column));
  if (missingColumns.length > 0) {
    return { missing: missingColumns, rows: [] as ParsedRow[] };
  }

  const rows: ParsedRow[] = [];
  const missingFields = new Set<string>();

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const values = Object.fromEntries(
      REQUIRED_COLUMNS.map((column) => [column, cells[headerMap.get(column)!] ?? ""])
    ) as Record<RequiredColumn, string>;

    for (const column of REQUIRED_COLUMNS) {
      if (!values[column]) {
        missingFields.add(`${column} (row: ${values.kpi || "unknown"})`);
      }
    }

    const current = Number(values.current);
    const target = Number(values.target);
    const previous = Number(values.previous);
    const direction = values.direction.toLowerCase();

    if (!Number.isFinite(current) || !Number.isFinite(target) || !Number.isFinite(previous)) {
      missingFields.add(`numeric fields (row: ${values.kpi || "unknown"})`);
      continue;
    }

    if (direction !== "higher_better" && direction !== "lower_better") {
      missingFields.add(`direction (row: ${values.kpi || "unknown"})`);
      continue;
    }

    rows.push({
      kpi: values.kpi,
      current,
      target,
      previous,
      owner: values.owner,
      direction
    });
  }

  return { missing: Array.from(missingFields), rows };
}

function classifySeverity(deltaToTargetPct: number): Severity {
  if (deltaToTargetPct >= 20) return "high";
  if (deltaToTargetPct >= 10) return "medium";
  return "low";
}

function metricFromRow(row: ParsedRow): OpsMetric {
  const unfavorableGap =
    row.direction === "higher_better"
      ? Math.max(0, row.target - row.current)
      : Math.max(0, row.current - row.target);

  const trendGap =
    row.direction === "higher_better" ? row.current - row.previous : row.previous - row.current;

  const deltaToTargetPct = row.target === 0 ? 0 : Number(((unfavorableGap / Math.abs(row.target)) * 100).toFixed(1));
  const trendDeltaPct = row.previous === 0 ? 0 : Number(((trendGap / Math.abs(row.previous)) * 100).toFixed(1));

  return {
    name: row.kpi,
    current: row.current,
    target: row.target,
    previous: row.previous,
    owner: row.owner,
    direction: row.direction,
    deltaToTargetPct,
    trendDeltaPct,
    severity: classifySeverity(deltaToTargetPct)
  };
}

function tokenMatches(rows: OpsMetric[], question?: string): string[] {
  if (!question) return [];
  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);

  if (tokens.length === 0) return [];

  return rows
    .filter((row) => tokens.some((token) => `${row.name} ${row.owner}`.toLowerCase().includes(token)))
    .map((row) => `${row.name} (${row.owner}) is ${row.deltaToTargetPct}% off target.`)
    .slice(0, 4);
}

export function analyzeOpsHealth(kpiText: string, question?: string) {
  const parsed = parseKpis(kpiText);

  if (parsed.missing.length > 0) {
    const insight: OpsHealthInsight = {
      summary: {
        metricsEvaluated: parsed.rows.length,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        overallState: "critical"
      },
      metricBoard: [],
      anomalyAlerts: [],
      briefingNarrative: [],
      actionPlan: [],
      queryHits: [],
      warnings: [
        `Missing required KPI fields: ${parsed.missing.join(", ")}.`
      ],
      whitespaceRows: REQUIRED_COLUMNS.map((column) => ({
        fieldWording: column,
        extractedValue: "",
        status: "MISSING"
      }))
    };

    return { missing: parsed.missing, insight };
  }

  const metricBoard = parsed.rows.map(metricFromRow);
  const highRisk = metricBoard.filter((metric) => metric.severity === "high");
  const mediumRisk = metricBoard.filter((metric) => metric.severity === "medium");
  const lowRisk = metricBoard.filter((metric) => metric.severity === "low");

  const overallState =
    highRisk.length >= 2 ? "critical" : highRisk.length === 1 || mediumRisk.length >= 2 ? "watch" : "stable";

  const anomalyAlerts = [
    ...highRisk.map((metric) => `${metric.name} is ${metric.deltaToTargetPct}% off target (${metric.owner}).`),
    ...mediumRisk.slice(0, 2).map((metric) => `${metric.name} requires watch-level remediation (${metric.owner}).`)
  ].slice(0, 5);

  const briefingNarrative = [
    `${metricBoard.length} KPIs evaluated across underwriting, broking, claims, and data operations.`,
    `${highRisk.length} high-risk metric(s) and ${mediumRisk.length} watch-level metric(s) are outside tolerance.`,
    overallState === "critical"
      ? "Operational resilience is at risk unless high-gap metrics are remediated within this cycle."
      : overallState === "watch"
        ? "Control drift is emerging and should be corrected before next committee checkpoint."
        : "Operations remain stable with manageable KPI variance."
  ];

  const actionPlan = [
    ...highRisk.map((metric) => `Escalate ${metric.name} owner (${metric.owner}) with a 5-day remediation target.`),
    ...mediumRisk
      .slice(0, 2)
      .map((metric) => `Set weekly checkpoint for ${metric.name} to close ${metric.deltaToTargetPct}% variance.`)
  ];

  if (actionPlan.length === 0) {
    actionPlan.push("Maintain current cadence and confirm KPI controls at next ops review.");
  }

  const warnings: string[] = [];
  if (highRisk.length > 0) warnings.push("One or more KPIs are in high-risk territory and need immediate escalation.");
  if (highRisk.length >= 2) warnings.push("Multiple high-risk KPIs indicate cross-functional execution pressure.");
  if (mediumRisk.length >= 2) warnings.push("Watch-level KPI drift is clustered and should be addressed this sprint.");

  const whitespaceRows = metricBoard.flatMap((metric) => [
    { fieldWording: `${metric.name} current`, extractedValue: String(metric.current), status: "EXTRACTED" as const },
    { fieldWording: `${metric.name} target`, extractedValue: String(metric.target), status: "EXTRACTED" as const },
    { fieldWording: `${metric.name} owner`, extractedValue: metric.owner, status: "EXTRACTED" as const },
    { fieldWording: `${metric.name} severity`, extractedValue: metric.severity, status: "EXTRACTED" as const }
  ]);

  const insight: OpsHealthInsight = {
    summary: {
      metricsEvaluated: metricBoard.length,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      lowRiskCount: lowRisk.length,
      overallState
    },
    metricBoard,
    anomalyAlerts,
    briefingNarrative,
    actionPlan,
    queryHits: tokenMatches(metricBoard, question),
    warnings,
    whitespaceRows
  };

  return { missing: [] as string[], insight };
}

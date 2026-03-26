import type { DataQualityInsight, QualityIssue, Severity } from "@/types/data-quality";

const REQUIRED_COLUMNS = [
  "record_id",
  "class_of_business",
  "country",
  "premium_gbp",
  "inception_date",
  "expiry_date"
] as const;

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function severityRank(severity: Severity): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

export function analyzeDataQuality(datasetText: string, question?: string) {
  const lines = datasetText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    const insight: DataQualityInsight = {
      summary: { rowsEvaluated: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0, qualityState: "fail" },
      issues: [],
      fixSuggestions: [],
      briefingNarrative: [],
      queryHits: [],
      warnings: ["Dataset must include a header and at least one row."],
      whitespaceRows: REQUIRED_COLUMNS.map((column) => ({
        fieldWording: column,
        extractedValue: "",
        status: "MISSING"
      }))
    };
    return { missing: ["rows"], insight };
  }

  const header = splitCsvLine(lines[0]).map((column) => column.toLowerCase());
  const headerMap = new Map<string, number>(header.map((column, index) => [column, index]));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headerMap.has(column));
  if (missingColumns.length > 0) {
    const insight: DataQualityInsight = {
      summary: { rowsEvaluated: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0, qualityState: "fail" },
      issues: [],
      fixSuggestions: [],
      briefingNarrative: [],
      queryHits: [],
      warnings: [`Missing required columns: ${missingColumns.join(", ")}.`],
      whitespaceRows: REQUIRED_COLUMNS.map((column) => ({
        fieldWording: column,
        extractedValue: headerMap.has(column) ? "present in header" : "",
        status: headerMap.has(column) ? "EXTRACTED" : "MISSING"
      }))
    };
    return { missing: missingColumns, insight };
  }

  const issues: QualityIssue[] = [];
  const seenIds = new Set<string>();
  const rows = lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const row = Object.fromEntries(
      REQUIRED_COLUMNS.map((column) => [column, cells[headerMap.get(column)!] ?? ""])
    ) as Record<RequiredColumn, string>;
    const rowRef = `row ${index + 2}`;

    REQUIRED_COLUMNS.forEach((column) => {
      if (!row[column]) {
        issues.push({
          rowRef,
          column,
          issue: `Missing value for ${column}`,
          severity: column === "record_id" || column === "class_of_business" ? "high" : "medium"
        });
      }
    });

    if (row.record_id) {
      if (seenIds.has(row.record_id)) {
        issues.push({
          rowRef,
          column: "record_id",
          issue: `Duplicate record_id detected: ${row.record_id}`,
          severity: "high"
        });
      }
      seenIds.add(row.record_id);
    }

    const premium = Number(row.premium_gbp);
    if (Number.isFinite(premium) && premium < 0) {
      issues.push({
        rowRef,
        column: "premium_gbp",
        issue: `Negative premium value: ${row.premium_gbp}`,
        severity: "high"
      });
    }

    if (row.inception_date && row.expiry_date) {
      const inception = parseDate(row.inception_date);
      const expiry = parseDate(row.expiry_date);
      if (!inception || !expiry) {
        issues.push({
          rowRef,
          column: "inception_date/expiry_date",
          issue: "Invalid date format found.",
          severity: "medium"
        });
      } else if (expiry <= inception) {
        issues.push({
          rowRef,
          column: "expiry_date",
          issue: "Expiry date is not later than inception date.",
          severity: "high"
        });
      }
    }

    return row;
  });

  const highIssues = issues.filter((issue) => issue.severity === "high").length;
  const mediumIssues = issues.filter((issue) => issue.severity === "medium").length;
  const lowIssues = issues.filter((issue) => issue.severity === "low").length;
  const qualityState: DataQualityInsight["summary"]["qualityState"] =
    highIssues > 0 ? "fail" : mediumIssues > 1 ? "watch" : "pass";

  const fixSuggestions = [
    highIssues > 0 ? "Resolve high-severity ID/date/premium defects before loading downstream systems." : null,
    mediumIssues > 0 ? "Fill required blanks and standardise date values before next handoff." : null,
    issues.length === 0 ? "No blocking quality issues detected; proceed to ingestion controls." : null
  ].filter(Boolean) as string[];

  const briefingNarrative = [
    `${rows.length} rows were validated against required schema and value checks.`,
    `${highIssues} high, ${mediumIssues} medium, and ${lowIssues} low issues were detected.`,
    qualityState === "fail"
      ? "Quality gate failed due to high-severity defects."
      : qualityState === "watch"
        ? "Quality gate is watch-level; remediation required before final release."
        : "Quality gate passed with no blocking defects."
  ];

  const tokens = (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  const queryHits =
    tokens.length === 0
      ? []
      : issues
          .filter((issue) =>
            tokens.some((token) => `${issue.column} ${issue.issue}`.toLowerCase().includes(token))
          )
          .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
          .slice(0, 5)
          .map((issue) => `${issue.rowRef}: ${issue.issue}`);

  const warnings = [
    highIssues > 0 ? "High-severity data defects detected; ingestion should be blocked." : null,
    mediumIssues >= 3 ? "Multiple medium issues indicate repeatable data capture quality drift." : null
  ].filter(Boolean) as string[];

  const whitespaceRows: DataQualityInsight["whitespaceRows"] = REQUIRED_COLUMNS.map((column) => ({
    fieldWording: column,
    extractedValue: headerMap.has(column) ? "present in header" : "",
    status: headerMap.has(column) ? "EXTRACTED" : "MISSING"
  }));

  return {
    missing: [] as string[],
    insight: {
      summary: {
        rowsEvaluated: rows.length,
        highIssues,
        mediumIssues,
        lowIssues,
        qualityState
      },
      issues,
      fixSuggestions,
      briefingNarrative,
      queryHits,
      warnings,
      whitespaceRows
    }
  };
}

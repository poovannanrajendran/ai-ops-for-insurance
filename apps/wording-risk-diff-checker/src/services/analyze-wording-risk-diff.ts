import type {
  ClauseDiff,
  DiffSummary,
  DiffWarning,
  ExecutiveBrief,
  ParsedClause,
  RiskTag,
  Severity,
  WordingRiskDiffInsight
} from "@/types/wording-risk-diff";

const headingTokens = ["coverage", "conditions", "claims", "territory", "extensions", "exclusions", "subjectivities"];
const coverageRestrictionTokens = ["only", "restricted", "subject to", "excluding", "excluded", "shall not", "not covered"];
const coverageExpansionTokens = ["included", "including", "extended", "cover granted", "carve-back", "write-back"];
const financialTokens = ["limit", "sublimit", "deductible", "excess", "retention", "aggregate", "attachment"];
const territoryTokens = ["territory", "jurisdiction", "geographical scope"];
const claimsTokens = ["claims notification", "notice", "reporting", "notification"];
const operationalTokens = ["condition", "warranty", "subjectivity", "inspection", "maintenance", "survey"];
const exclusionTokens = ["exclusion", "sanctions", "cyber", "communicable disease", "war"];

function compact(value: string): string {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeForCompare(value: string): string {
  return compact(value).toLowerCase();
}

function isSectionHeading(line: string): boolean {
  const normalized = line.trim();
  if (!normalized.endsWith(":")) {
    return false;
  }

  const bare = normalized.slice(0, -1).toLowerCase();
  return headingTokens.some((token) => bare.includes(token));
}

function splitLabelValue(line: string): { label: string; value: string } {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    const words = compact(line).split(" ");
    return {
      label: words.slice(0, Math.min(words.length, 6)).join(" "),
      value: compact(line)
    };
  }

  return {
    label: compact(line.slice(0, separatorIndex)),
    value: compact(line.slice(separatorIndex + 1))
  };
}

export function parseWordingClauses(text: string): ParsedClause[] {
  const rawLines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let section = "General";
  let bulletIndex = 0;

  return rawLines.flatMap((line) => {
    if (isSectionHeading(line)) {
      section = compact(line.replace(/:$/, ""));
      bulletIndex = 0;
      return [];
    }

    const isBullet = /^[-*•]\s*/.test(line);
    const cleaned = compact(line.replace(/^[-*•]\s*/, ""));
    const split = splitLabelValue(cleaned);
    const label = isBullet ? `${section} bullet ${++bulletIndex}` : split.label;
    const value = split.value || cleaned;

    return [
      {
        key: `${slug(section)}::${slug(label)}`,
        section,
        label,
        value,
        normalizedValue: normalizeForCompare(value)
      }
    ];
  });
}

function extractNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const sanitized = value.replace(/,/g, "");
  const match = sanitized.match(/(?:GBP|USD|EUR)?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function territoryBreadth(value: string | null): number {
  if (!value) {
    return 0;
  }

  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function includesAny(text: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

function classifyChange(
  label: string,
  baselineValue: string | null,
  revisedValue: string | null,
  changeType: ClauseDiff["changeType"]
): { severity: Severity; tags: RiskTag[]; rationale: string; isMaterial: boolean } {
  const combined = normalizeForCompare(`${label} ${baselineValue ?? ""} ${revisedValue ?? ""}`);
  const tags = new Set<RiskTag>();

  if (includesAny(combined, territoryTokens)) {
    tags.add("territory_scope");
  }
  if (includesAny(combined, financialTokens)) {
    tags.add("financial_shift");
  }
  if (includesAny(combined, claimsTokens)) {
    tags.add("claims_obligation");
  }
  if (includesAny(combined, operationalTokens)) {
    tags.add("operational_condition");
  }
  if (includesAny(combined, exclusionTokens)) {
    tags.add("exclusion_change");
  }

  const baselineNormalized = normalizeForCompare(baselineValue ?? "");
  const revisedNormalized = normalizeForCompare(revisedValue ?? "");

  if (changeType === "added" && includesAny(revisedNormalized, coverageRestrictionTokens)) {
    tags.add("coverage_restriction");
    return {
      severity: "high",
      tags: [...tags],
      rationale: "A new restrictive clause was added in the revised wording.",
      isMaterial: true
    };
  }

  if (changeType === "removed" && includesAny(baselineNormalized, coverageExpansionTokens)) {
    tags.add("coverage_restriction");
    return {
      severity: "high",
      tags: [...tags],
      rationale: "A prior coverage allowance or carve-back is absent from the revised wording.",
      isMaterial: true
    };
  }

  if (includesAny(combined, financialTokens)) {
    const baselineNumber = extractNumber(baselineValue);
    const revisedNumber = extractNumber(revisedValue);

    if (combined.includes("deductible") || combined.includes("excess") || combined.includes("retention")) {
      if (baselineNumber != null && revisedNumber != null && revisedNumber > baselineNumber) {
        return {
          severity: "high",
          tags: [...tags],
          rationale: "The revised wording increases insured retention and shifts more loss participation to the policyholder.",
          isMaterial: true
        };
      }
    }

    if (combined.includes("limit") || combined.includes("sublimit") || combined.includes("aggregate")) {
      if (baselineNumber != null && revisedNumber != null && revisedNumber < baselineNumber) {
        return {
          severity: "high",
          tags: [...tags],
          rationale: "The revised wording reduces available limit compared with the baseline wording.",
          isMaterial: true
        };
      }

      if (baselineNumber != null && revisedNumber != null && revisedNumber > baselineNumber) {
        tags.add("coverage_expansion");
        return {
          severity: "medium",
          tags: [...tags],
          rationale: "The revised wording broadens financial capacity and should be confirmed against pricing intent.",
          isMaterial: true
        };
      }
    }
  }

  if (includesAny(combined, territoryTokens)) {
    const baselineBreadth = territoryBreadth(baselineValue);
    const revisedBreadth = territoryBreadth(revisedValue);
    if (revisedBreadth > 0 && baselineBreadth > 0 && revisedBreadth < baselineBreadth) {
      tags.add("coverage_restriction");
      return {
        severity: "high",
        tags: [...tags],
        rationale: "Territorial or jurisdictional scope appears narrower in the revised wording.",
        isMaterial: true
      };
    }

    if (revisedBreadth > baselineBreadth) {
      tags.add("coverage_expansion");
      return {
        severity: "medium",
        tags: [...tags],
        rationale: "Territorial scope expands in the revised wording and should be reviewed against appetite.",
        isMaterial: true
      };
    }
  }

  if (includesAny(combined, exclusionTokens)) {
    if (includesAny(revisedNormalized, coverageRestrictionTokens) || changeType !== "changed") {
      tags.add("coverage_restriction");
    }

    return {
      severity: "high",
      tags: [...tags],
      rationale: "The change affects exclusionary or sanctions wording with direct coverage implications.",
      isMaterial: true
    };
  }

  if (includesAny(combined, claimsTokens)) {
    return {
      severity: "medium",
      tags: [...tags],
      rationale: "The change alters claims handling or reporting obligations and may affect compliance timeliness.",
      isMaterial: true
    };
  }

  if (includesAny(combined, operationalTokens)) {
    return {
      severity: "medium",
      tags: [...tags],
      rationale: "The change affects an operational condition that can alter servicing or compliance expectations.",
      isMaterial: true
    };
  }

  if (includesAny(revisedNormalized, coverageExpansionTokens) && changeType !== "removed") {
    tags.add("coverage_expansion");
    return {
      severity: "medium",
      tags: [...tags],
      rationale: "The revised wording appears broader and should be checked against underwriting intent.",
      isMaterial: true
    };
  }

  tags.add("administrative");
  return {
    severity: "low",
    tags: [...tags],
    rationale: "The wording changed, but the delta looks administrative or low-impact on first pass.",
    isMaterial: changeType !== "changed" || baselineNormalized !== revisedNormalized
  };
}

function buildClauseDiffs(baselineClauses: ParsedClause[], revisedClauses: ParsedClause[]): ClauseDiff[] {
  const baselineMap = new Map(baselineClauses.map((clause) => [clause.key, clause]));
  const revisedMap = new Map(revisedClauses.map((clause) => [clause.key, clause]));
  const allKeys = new Set([...baselineMap.keys(), ...revisedMap.keys()]);

  return [...allKeys]
    .map((key) => {
      const baseline = baselineMap.get(key) ?? null;
      const revised = revisedMap.get(key) ?? null;

      if (baseline && revised && baseline.normalizedValue === revised.normalizedValue) {
        return null;
      }

      const changeType: ClauseDiff["changeType"] = baseline && revised ? "changed" : baseline ? "removed" : "added";
      const classification = classifyChange(baseline?.label ?? revised?.label ?? key, baseline?.value ?? null, revised?.value ?? null, changeType);

      return {
        clauseKey: key,
        section: baseline?.section ?? revised?.section ?? "General",
        label: baseline?.label ?? revised?.label ?? "Unmapped clause",
        changeType,
        baselineValue: baseline?.value ?? null,
        revisedValue: revised?.value ?? null,
        severity: classification.severity,
        tags: classification.tags,
        rationale: classification.rationale,
        isMaterial: classification.isMaterial
      } satisfies ClauseDiff;
    })
    .filter((value): value is ClauseDiff => value !== null)
    .sort((left, right) => {
      const severityRank = { high: 0, medium: 1, low: 2 } satisfies Record<Severity, number>;
      return severityRank[left.severity] - severityRank[right.severity] || left.section.localeCompare(right.section) || left.label.localeCompare(right.label);
    });
}

function buildSummary(totalBaseline: number, totalRevised: number, clauseDiffs: ClauseDiff[]): DiffSummary {
  const addedCount = clauseDiffs.filter((item) => item.changeType === "added").length;
  const removedCount = clauseDiffs.filter((item) => item.changeType === "removed").length;
  const changedCount = clauseDiffs.filter((item) => item.changeType === "changed").length;
  const materialChangeCount = clauseDiffs.filter((item) => item.isMaterial).length;
  const highSeverityCount = clauseDiffs.filter((item) => item.severity === "high").length;
  const mediumSeverityCount = clauseDiffs.filter((item) => item.severity === "medium").length;
  const lowSeverityCount = clauseDiffs.filter((item) => item.severity === "low").length;
  const comparedUniverse = new Set<number>([totalBaseline, totalRevised]).size === 1 ? totalBaseline : Math.max(totalBaseline, totalRevised);

  return {
    totalComparedClauses: comparedUniverse,
    stableCount: Math.max(0, comparedUniverse - clauseDiffs.length),
    addedCount,
    removedCount,
    changedCount,
    materialChangeCount,
    highSeverityCount,
    mediumSeverityCount,
    lowSeverityCount
  };
}

function buildWarnings(summary: DiffSummary, clauseDiffs: ClauseDiff[], baselineText: string, revisedText: string): DiffWarning[] {
  const warnings: DiffWarning[] = [];
  const combinedLength = compact(`${baselineText} ${revisedText}`).length;

  if (combinedLength < 450 || summary.totalComparedClauses < 4) {
    warnings.push({
      code: "sparse_wording_input",
      message: "Input wording is sparse. Treat low-severity output cautiously until a fuller schedule or endorsement extract is loaded."
    });
  }

  if (clauseDiffs.some((item) => item.tags.includes("coverage_restriction") && item.severity === "high")) {
    warnings.push({
      code: "coverage_restriction_shift",
      message: "High-severity coverage restriction detected. Escalate before bind or renewal sign-off."
    });
  }

  if (clauseDiffs.some((item) => item.tags.includes("financial_shift") && item.severity === "high")) {
    warnings.push({
      code: "financial_shift_detected",
      message: "Financial participation has shifted materially through limits, sublimits, or retention wording."
    });
  }

  if (summary.materialChangeCount >= 4) {
    warnings.push({
      code: "multiple_material_changes",
      message: `${summary.materialChangeCount} material clause changes were detected in a single pass. Consolidated underwriting review is recommended.`
    });
  }

  return warnings;
}

function buildExecutiveBrief(summary: DiffSummary, clauseDiffs: ClauseDiff[], warnings: DiffWarning[]): ExecutiveBrief {
  const topDiffs = clauseDiffs.slice(0, 3);
  const topLabels = topDiffs.map((item) => `${item.label} (${item.changeType}, ${item.severity})`);

  if (summary.materialChangeCount === 0) {
    return {
      headline: "No material wording deltas identified on first pass.",
      narrative: "The revised wording remains broadly aligned to the baseline wording. Any detected deltas appear administrative.",
      actions: ["Retain standard peer review", "Archive the comparison outcome alongside the endorsement version"]
    };
  }

  return {
    headline:
      summary.highSeverityCount > 0
        ? `${summary.highSeverityCount} high-severity wording delta(s) require escalation.`
        : `${summary.materialChangeCount} material wording delta(s) detected.` ,
    narrative: `The most consequential shifts are ${topLabels.join(", ")}. ${warnings[0]?.message ?? "Review the clause ledger before approval."}`,
    actions: [
      `Confirm pricing and authority alignment for ${summary.highSeverityCount || summary.materialChangeCount} key clause delta(s).`,
      `Obtain legal/wording sign-off for highest-risk clause ${topDiffs[0]?.label ?? "N/A"} (${topDiffs[0]?.changeType ?? "changed"}).`,
      `Record accepted deltas in decision log with warning codes: ${warnings.map((w) => w.code).join(", ") || "none"}.`
    ]
  };
}

function buildQueryHits(clauseDiffs: ClauseDiff[], warnings: DiffWarning[], question?: string): string[] {
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
    ...clauseDiffs.map((item) => `${item.label} ${item.changeType} ${item.severity} ${item.tags.join(" ")} ${item.rationale}`),
    ...warnings.map((warning) => warning.message)
  ];

  const hits: string[] = [];
  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (tokens.some((token) => normalized.includes(token))) {
      hits.push(line);
    }
    if (hits.length >= 6) {
      break;
    }
  }

  return hits;
}

export function analyzeWordingRiskDiff(
  baselineText: string,
  revisedText: string,
  question?: string
): WordingRiskDiffInsight {
  const parsedBaselineClauses = parseWordingClauses(baselineText);
  const parsedRevisedClauses = parseWordingClauses(revisedText);
  const clauseDiffs = buildClauseDiffs(parsedBaselineClauses, parsedRevisedClauses);
  const summary = buildSummary(parsedBaselineClauses.length, parsedRevisedClauses.length, clauseDiffs);
  const warnings = buildWarnings(summary, clauseDiffs, baselineText, revisedText);
  const executiveBrief = buildExecutiveBrief(summary, clauseDiffs, warnings);
  const queryHits = buildQueryHits(clauseDiffs, warnings, question);

  return {
    summary,
    warnings,
    executiveBrief,
    clauseDiffs,
    parsedBaselineClauses,
    parsedRevisedClauses,
    queryHits
  };
}

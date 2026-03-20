import type {
  ClauseDiff,
  DiffSummary,
  DiffWarning,
  ParsedClause,
  PolicyEndorsementDiffInsight,
  Severity
} from "@/types/policy-endorsement-diff";

const highImpactTokens = [
  "limit",
  "deductible",
  "excess",
  "sublimit",
  "territory",
  "jurisdiction",
  "retroactive",
  "aggregate",
  "attachment",
  "exclusion",
  "sanctions",
  "cyber",
  "claims notification"
] as const;

const mediumImpactTokens = ["condition", "subjectivity", "warranty", "reporting", "notice", "maintenance", "survey"] as const;

function compact(text: string): string {
  return text.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isSectionHeading(line: string): boolean {
  return line.endsWith(":") && !line.includes(": ");
}

function toLabel(line: string): { label: string; value: string } {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    return {
      label: line.split(" ").slice(0, 6).join(" "),
      value: line
    };
  }

  return {
    label: line.slice(0, separatorIndex).trim(),
    value: line.slice(separatorIndex + 1).trim()
  };
}

function parseClauses(text: string): ParsedClause[] {
  const rawLines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let section = "General";
  let bulletIndex = 0;

  return rawLines.flatMap((line) => {
    if (isSectionHeading(line)) {
      section = line.replace(/:$/, "").trim();
      bulletIndex = 0;
      return [];
    }

    const cleaned = line.replace(/^[-*]\s*/, "");
    const { label, value } = toLabel(cleaned);
    const isBullet = /^[-*]\s*/.test(line);
    const computedLabel = isBullet ? `${section} bullet ${++bulletIndex}` : label;

    return [
      {
        key: `${slug(section)}::${slug(computedLabel)}`,
        section,
        label: computedLabel,
        value: value || cleaned
      }
    ];
  });
}

function extractNumber(value: string): number | null {
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/(?:GBP|USD|EUR)?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function territoryCount(value: string): number {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function deriveSeverity(label: string, expiringValue: string | null, renewalValue: string | null, changeType: ClauseDiff["changeType"]): {
  isMaterial: boolean;
  rationale: string;
  severity: Severity;
} {
  const left = compact(`${label} ${expiringValue ?? ""}`).toLowerCase();
  const right = compact(`${label} ${renewalValue ?? ""}`).toLowerCase();
  const combined = `${left} ${right}`;

  if (changeType === "added" && /(exclusion|sanctions|claims notification|jurisdiction|territory)/.test(right)) {
    return {
      severity: "high",
      isMaterial: true,
      rationale: "A restrictive endorsement term has been added on renewal."
    };
  }

  if (changeType === "removed" && /(carve-back|included|coverage)/.test(left)) {
    return {
      severity: "high",
      isMaterial: true,
      rationale: "The expiring wording included a coverage allowance that is now absent."
    };
  }

  if (combined.includes("limit")) {
    const expiringNumber = expiringValue ? extractNumber(expiringValue) : null;
    const renewalNumber = renewalValue ? extractNumber(renewalValue) : null;

    if (expiringNumber != null && renewalNumber != null && renewalNumber < expiringNumber) {
      return {
        severity: "high",
        isMaterial: true,
        rationale: "Renewal reduces the available limit relative to expiring wording."
      };
    }
  }

  if (/(deductible|excess)/.test(combined)) {
    const expiringNumber = expiringValue ? extractNumber(expiringValue) : null;
    const renewalNumber = renewalValue ? extractNumber(renewalValue) : null;

    if (expiringNumber != null && renewalNumber != null && renewalNumber > expiringNumber) {
      return {
        severity: "high",
        isMaterial: true,
        rationale: "Renewal increases the deductible/excess and shifts more loss to the insured."
      };
    }
  }

  if (/(territory|jurisdiction)/.test(combined) && expiringValue && renewalValue) {
    if (/only|excluding|exclusive/.test(renewalValue.toLowerCase()) || territoryCount(renewalValue) < territoryCount(expiringValue)) {
      return {
        severity: "high",
        isMaterial: true,
        rationale: "Renewal narrows territorial or jurisdictional reach versus expiring wording."
      };
    }
  }

  if (/(cyber|sanctions|exclusion|retroactive|claims notification)/.test(combined)) {
    return {
      severity: "high",
      isMaterial: true,
      rationale: "Critical wording change affecting coverage scope or claims handling obligations."
    };
  }

  if (highImpactTokens.some((token) => combined.includes(token))) {
    return {
      severity: "high",
      isMaterial: true,
      rationale: "High-impact wording area changed and should be escalated for underwriting review."
    };
  }

  if (mediumImpactTokens.some((token) => combined.includes(token))) {
    return {
      severity: "medium",
      isMaterial: true,
      rationale: "Operational condition changed and may alter compliance or servicing expectations."
    };
  }

  return {
    severity: "low",
    isMaterial: changeType !== "changed" || compact(expiringValue ?? "") !== compact(renewalValue ?? ""),
    rationale: "Wording changed but the shift appears administrative or low-impact on first pass."
  };
}

function buildClauseDiffs(expiringClauses: ParsedClause[], renewalClauses: ParsedClause[]): ClauseDiff[] {
  const expiringMap = new Map(expiringClauses.map((item) => [item.key, item]));
  const renewalMap = new Map(renewalClauses.map((item) => [item.key, item]));
  const allKeys = new Set([...expiringMap.keys(), ...renewalMap.keys()]);

  return [...allKeys]
    .map((key) => {
      const left = expiringMap.get(key) ?? null;
      const right = renewalMap.get(key) ?? null;

      if (left && right && compact(left.value) === compact(right.value)) {
        return null;
      }

      const changeType: ClauseDiff["changeType"] = left && right ? "changed" : left ? "removed" : "added";
      const severityDetails = deriveSeverity(left?.label ?? right?.label ?? key, left?.value ?? null, right?.value ?? null, changeType);

      return {
        label: left?.label ?? right?.label ?? "Unmapped clause",
        section: left?.section ?? right?.section ?? "General",
        changeType,
        expiringValue: left?.value ?? null,
        renewalValue: right?.value ?? null,
        severity: severityDetails.severity,
        rationale: severityDetails.rationale,
        isMaterial: severityDetails.isMaterial
      } satisfies ClauseDiff;
    })
    .filter((item): item is ClauseDiff => item !== null)
    .sort((a, b) => {
      const severityRank = { high: 0, medium: 1, low: 2 } as const;
      return severityRank[a.severity] - severityRank[b.severity] || a.label.localeCompare(b.label);
    });
}

function buildSummary(clauseDiffs: ClauseDiff[], expiringClauses: ParsedClause[], renewalClauses: ParsedClause[]): DiffSummary {
  const totalComparedClauses = new Set([
    ...expiringClauses.map((item) => item.key),
    ...renewalClauses.map((item) => item.key)
  ]).size;

  return {
    totalComparedClauses,
    materialChangeCount: clauseDiffs.filter((item) => item.isMaterial).length,
    addedCount: clauseDiffs.filter((item) => item.changeType === "added").length,
    removedCount: clauseDiffs.filter((item) => item.changeType === "removed").length,
    changedCount: clauseDiffs.filter((item) => item.changeType === "changed").length,
    highSeverityCount: clauseDiffs.filter((item) => item.severity === "high").length,
    mediumSeverityCount: clauseDiffs.filter((item) => item.severity === "medium").length,
    lowSeverityCount: clauseDiffs.filter((item) => item.severity === "low").length,
    stableCount: totalComparedClauses - clauseDiffs.length
  };
}

function buildWarnings(summary: DiffSummary, clauseDiffs: ClauseDiff[], expiringClauses: ParsedClause[], renewalClauses: ParsedClause[]): DiffWarning[] {
  const warnings: DiffWarning[] = [];

  if (summary.highSeverityCount > 0) {
    warnings.push({
      code: "critical_shift",
      message: `${summary.highSeverityCount} high-severity wording shift(s) detected. Escalate before release or bind.`
    });
  }

  if (summary.materialChangeCount >= 4) {
    warnings.push({
      code: "multiple_material_changes",
      message: "Multiple material changes detected across the renewal wording. Full reviewer sign-off is recommended."
    });
  }

  if (clauseDiffs.some((item) => item.rationale.toLowerCase().includes("narrows territorial") || item.rationale.toLowerCase().includes("restrictive"))) {
    warnings.push({
      code: "coverage_restriction",
      message: "Coverage appears narrower on renewal. Check territorial, exclusion, and claims-notification wording carefully."
    });
  }

  if (expiringClauses.length < 4 || renewalClauses.length < 4) {
    warnings.push({
      code: "sparse_wording",
      message: "One or both documents are sparse. Clause matching confidence is lower than the preferred threshold."
    });
  }

  return warnings;
}

function buildQueryHits(clauseDiffs: ClauseDiff[], question?: string): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);

  if (tokens.length === 0) {
    return [];
  }

  return clauseDiffs
    .filter((item) => tokens.some((token) => `${item.label} ${item.rationale}`.toLowerCase().includes(token)))
    .slice(0, 5)
    .map((item) => `${item.label}: ${item.rationale}`);
}

function buildExecutiveBrief(summary: DiffSummary, clauseDiffs: ClauseDiff[], question?: string): PolicyEndorsementDiffInsight["executiveBrief"] {
  const topChanges = clauseDiffs.slice(0, 3);
  const headline =
    summary.highSeverityCount > 0
      ? `${summary.highSeverityCount} high-severity endorsement change(s) need escalation.`
      : `${summary.materialChangeCount} material wording change(s) identified.`;

  const findings = topChanges.map((item) => `${item.label}: ${item.rationale}`);
  const actionPoints = [
    "Confirm whether underwriting intent supports the renewal wording restriction before release.",
    "Issue a marked-up reviewer summary to broker or counsel for any high-severity change.",
    "Capture commercial sign-off for deductible, limit, territory, or exclusion shifts."
  ];

  const queryResponse =
    question && question.trim().length > 0
      ? buildQueryHits(clauseDiffs, question).join(" ") || "No direct clause hit matched the query tokens in this run."
      : "No query prompt supplied for targeted commentary.";

  return {
    headline,
    findings,
    actionPoints,
    queryResponse
  };
}

export function analyzePolicyEndorsementDiff(
  expiringText: string,
  renewalText: string,
  question?: string | null
): PolicyEndorsementDiffInsight {
  const parsedExpiringClauses = parseClauses(expiringText);
  const parsedRenewalClauses = parseClauses(renewalText);
  const clauseDiffs = buildClauseDiffs(parsedExpiringClauses, parsedRenewalClauses);
  const summary = buildSummary(clauseDiffs, parsedExpiringClauses, parsedRenewalClauses);
  const warnings = buildWarnings(summary, clauseDiffs, parsedExpiringClauses, parsedRenewalClauses);
  const queryHits = buildQueryHits(clauseDiffs, question ?? undefined);

  return {
    parsedExpiringClauses,
    parsedRenewalClauses,
    clauseDiffs,
    summary,
    warnings,
    queryHits,
    executiveBrief: buildExecutiveBrief(summary, clauseDiffs, question ?? undefined)
  };
}

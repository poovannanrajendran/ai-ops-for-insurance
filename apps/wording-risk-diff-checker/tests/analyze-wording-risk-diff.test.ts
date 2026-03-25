import { describe, expect, it } from "vitest";

import { analyzeWordingRiskDiff, parseWordingClauses } from "@/services/analyze-wording-risk-diff";

const baselineText = `Policy Schedule: PROP-72144
Coverage:
Territory: United Kingdom, Ireland, France, Germany
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 25,000 each and every loss
Cyber Exclusion: Silent cyber carve-back for direct physical damage is included
Claims Notification: Notify circumstances as soon as practicable
Conditions:
- Sprinkler impairment to be reported within 30 days
- Vacant premises subject to weekly inspection`;

const revisedText = `Policy Schedule: PROP-72144
Coverage:
Territory: United Kingdom and Ireland only
Limit of Liability: GBP 7,500,000 any one occurrence
Deductible: GBP 100,000 each and every loss
Cyber Exclusion: Absolute cyber exclusion applies with no carve-back
Claims Notification: Notify all losses within 14 days
Conditions:
- Sprinkler impairment to be reported within 7 days
- Vacant premises subject to daily inspection and prior insurer approval`;

describe("parseWordingClauses", () => {
  it("parses headings, labels, and bullets deterministically", () => {
    const parsed = parseWordingClauses(baselineText);

    expect(parsed.some((item) => item.key === "coverage::territory")).toBe(true);
    expect(parsed.some((item) => item.label === "Conditions bullet 1")).toBe(true);
    expect(parsed[0]?.label).toBe("Policy Schedule");
  });
});

describe("analyzeWordingRiskDiff", () => {
  it("flags restrictive coverage changes with high severity", () => {
    const result = analyzeWordingRiskDiff(baselineText, revisedText, "Which wording changes are materially restrictive?");

    expect(result.summary.materialChangeCount).toBeGreaterThan(0);
    expect(result.summary.highSeverityCount).toBeGreaterThan(0);
    expect(result.warnings.some((warning) => warning.code === "coverage_restriction_shift")).toBe(true);
    expect(result.clauseDiffs.some((item) => item.label === "Territory" && item.severity === "high")).toBe(true);
    expect(result.clauseDiffs.some((item) => item.label === "Deductible" && item.tags.includes("financial_shift"))).toBe(true);
    expect(result.queryHits.length).toBeGreaterThan(0);
  });

  it("detects broader wording as medium-severity expansion rather than restriction", () => {
    const broader = analyzeWordingRiskDiff(
      `Coverage:\nJurisdiction: United Kingdom only\nLimit of Liability: GBP 2,500,000 any one claim`,
      `Coverage:\nJurisdiction: United Kingdom, European Union, and Switzerland\nLimit of Liability: GBP 5,000,000 any one claim`
    );

    expect(broader.clauseDiffs.some((item) => item.tags.includes("coverage_expansion"))).toBe(true);
    expect(broader.clauseDiffs.some((item) => item.severity === "medium")).toBe(true);
  });

  it("returns sparse-input warning for short or thin wording", () => {
    const thin = analyzeWordingRiskDiff("Territory: UK\nLimit: GBP 1m", "Territory: UK only\nLimit: GBP 1m");

    expect(thin.warnings.some((warning) => warning.code === "sparse_wording_input")).toBe(true);
  });
});

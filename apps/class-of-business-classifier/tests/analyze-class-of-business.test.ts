import { buildClassOfBusinessInsight } from "../src/services/analyze-class-of-business";
import { describe, expect, it } from "vitest";

describe("buildClassOfBusinessInsight", () => {
  it("classifies clear property narratives", () => {
    const insight = buildClassOfBusinessInsight(`
      Insured operates multiple warehouse buildings in the UK.
      Coverage requested is property damage and business interruption with a sum insured of GBP 18,000,000.
      Premises include chilled storage and stock throughput.
    `);

    expect(insight.summary.topLabel).toBe("Property");
    expect(insight.summary.topConfidence).toBeGreaterThan(0.5);
    expect(insight.warnings.find((warning) => warning.code === "low_confidence")).toBeUndefined();
  });

  it("returns low confidence warning when signals are sparse", () => {
    const insight = buildClassOfBusinessInsight(`
      Small regional manufacturer requesting insurance.
      Wants broad cover and fast quote turnaround.
      Limited detail currently available.
    `);

    expect(insight.warnings.some((warning) => warning.code === "low_confidence")).toBe(true);
    expect(insight.summary.topLabel).toBeTruthy();
  });

  it("flags ambiguity when cyber and financial lines signals are close", () => {
    const insight = buildClassOfBusinessInsight(`
      Fintech board requests directors and officers protection.
      Proposal also includes data breach response support.
      Underwriters requested management liability terms.
    `);

    expect(insight.summary.candidateCount).toBeGreaterThan(1);
    expect(insight.warnings.some((warning) => warning.code === "ambiguous_classification")).toBe(true);
  });
});

import { buildRiskAppetiteInsight } from "../src/services/analyze-risk-appetite";
import { describe, expect, it } from "vitest";

describe("buildRiskAppetiteInsight", () => {
  const sampleStatement = `Insured Name: Helios Engineering Group
Class of Business: Property, Marine Cargo
Territory: United Kingdom, Europe
Max Line Size: GBP 5,000,000
Currency: GBP
Minimum Premium: GBP 125,000
Inception Date: 2026-01-01
Expiry Date: 2026-12-31

Exclusions:
- Coal mining operations
- Sanctioned jurisdictions

Subjectivities:
- Updated valuation report within 90 days

Referral Triggers:
- Any one location over GBP 15,000,000 TIV`;

  it("extracts standard whitespace fields from statement text", () => {
    const insight = buildRiskAppetiteInsight(sampleStatement);

    expect(insight.structuredData.insuredName).toBe("Helios Engineering Group");
    expect(insight.structuredData.classOfBusiness).toEqual(["Property", "Marine Cargo"]);
    expect(insight.structuredData.territory).toEqual(["United Kingdom", "Europe"]);
    expect(insight.structuredData.maxLineSize).toBe("GBP 5,000,000");
    expect(insight.structuredData.referralTriggers).toEqual([
      "Any One Location Over GBP 15,000,000 TIV"
    ]);
    expect(insight.summary.matchedFields).toBeGreaterThanOrEqual(8);
  });

  it("flags missing required fields with a high-severity warning", () => {
    const malformed = `Insured Name: Incomplete Example
Currency: GBP
Exclusions:
- None`;
    const insight = buildRiskAppetiteInsight(malformed);

    expect(insight.warnings.some((warning) => warning.severity === "high")).toBe(true);
    expect(insight.warnings[0]?.message).toContain("Missing required data");
  });

  it("returns query hits aligned to extracted fields", () => {
    const insight = buildRiskAppetiteInsight(
      sampleStatement,
      "what are the referral triggers and exclusions?"
    );

    expect(insight.query.hits.length).toBeGreaterThan(0);
    expect(insight.query.hits.some((hit) => hit.fieldName === "referral_triggers")).toBe(true);
  });
});

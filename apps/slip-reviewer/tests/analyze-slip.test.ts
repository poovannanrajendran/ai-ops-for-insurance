import { buildSlipReviewInsight } from "../src/services/analyze-slip";
import { describe, expect, it } from "vitest";

describe("buildSlipReviewInsight", () => {
  const completeSlipSample = `UNIQUE MARKET REFERENCE: B0180FN2520474
INSURED: Affiliated Clubs Of The England And Wales Cricket Board as set out in Appendix A
BROKER: Howden Insurance Brokers Limited
PERIOD: From 01 February 2025 to 31 January 2026
LIMIT OF LIABILITY: GBP 2,000,000 Policy Aggregate Limit including claims expenses
RETENTION: GBP 50,000 any one claim and in the aggregate
TERRITORIAL LIMITS: Worldwide
CLAIMS BASIS: Claims Made Basis - Retroactive Date: Full Prior Acts
NOTIFICATION OF CLAIMS TO: FLnewclaims@howdengroup.com

Wording:
- LMA5567B War and Cyber Operation Exclusion
- LMA3100 Sanction Limitation and Exclusion Clause

SUBJECTIVITIES: None
CHOICE OF LAW: Laws of England and Wales
CHOICE OF JURISDICTION: Courts of England and Wales
PAYMENT TERMS: LSW3001 PREMIUM PAYMENT CLAUSE - 60 DAYS`;

  it("extracts Day 4 slip fields and passes required gate on complete sample", () => {
    const insight = buildSlipReviewInsight(completeSlipSample);

    expect(insight.structuredData.insuredName).toContain("England And Wales Cricket Board");
    expect(insight.structuredData.inceptionDate).toContain("01 February 2025");
    expect(insight.structuredData.expiryDate).toContain("31 January 2026");
    expect(insight.structuredData.limit).toContain("GBP 2,000,000");
    expect(insight.structuredData.currency).toBe("GBP");
    expect(insight.summary.gatePassed).toBe(true);
  });

  it("raises required-field gate failures on incomplete sample", () => {
    const incomplete = `INSURED: Example Sports Association
BROKER: Sample Market Broker
CLAIMS BASIS: Claims Made Basis
NOTIFICATION OF CLAIMS TO: claims@example.com`;

    const insight = buildSlipReviewInsight(incomplete);

    expect(insight.summary.gatePassed).toBe(false);
    expect(insight.summary.missingRequiredFields).toEqual(
      expect.arrayContaining(["inception_date", "expiry_date", "limit", "currency"])
    );
    expect(insight.coverageGaps.some((gap) => gap.severity === "high")).toBe(true);
  });

  it("returns query hits aligned to extracted fields", () => {
    const insight = buildSlipReviewInsight(
      completeSlipSample,
      "What are the limit, exclusions, and claims notification details?"
    );

    expect(insight.query.hits.length).toBeGreaterThan(0);
    expect(insight.query.hits.some((hit) => hit.fieldName === "limit")).toBe(true);
  });
});

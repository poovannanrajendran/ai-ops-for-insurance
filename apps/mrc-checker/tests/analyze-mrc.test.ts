import { describe, expect, it } from "vitest";

import { analyzeMrcText } from "@/services/analyze-mrc";

const baselineMrc = `UNIQUE MARKET REFERENCE: B0180FN2520474
TYPE: Insurance
INSURED: Affiliated Clubs Of The England And Wales Cricket Board
BROKER: Howden Insurance Brokers Limited
PERIOD: From 01 February 2025 to 31 January 2026
INTEREST: Liability arising out of cricket operations
TERRITORIAL LIMITS: Worldwide
LIMIT OF LIABILITY: GBP 2,000,000 policy aggregate
RETENTION: GBP 50,000 each claim
NOTIFICATION OF CLAIMS TO: FLnewclaims@howdengroup.com
PAYMENT TERMS: LSW3001 Premium Payment Clause - 60 days
WORDING:
- LMA5567B War and Cyber Operation Exclusion
- LMA3100 Sanction Limitation and Exclusion Clause
CHOICE OF LAW: Laws of England and Wales
CHOICE OF JURISDICTION: Courts of England and Wales`;

describe("analyzeMrcText", () => {
  it("passes gate for complete baseline wording", () => {
    const analysis = analyzeMrcText(baselineMrc, "Which clauses are present?");

    expect(analysis.summary.gatePassed).toBe(true);
    expect(analysis.summary.fieldCoverage).toBeGreaterThan(60);
    expect(analysis.referrals.length).toBe(0);
    expect(analysis.clauseChecks.some((clause) => clause.status === "present")).toBe(true);
  });

  it("fails gate when required fields are missing", () => {
    const analysis = analyzeMrcText(
      `INSURED: Example Sports Association
INTEREST: Community sports third-party liability
TERRITORIAL LIMITS: Europe`
    );

    expect(analysis.summary.gatePassed).toBe(false);
    expect(analysis.summary.missingRequiredFields.length).toBeGreaterThan(0);
  });
});


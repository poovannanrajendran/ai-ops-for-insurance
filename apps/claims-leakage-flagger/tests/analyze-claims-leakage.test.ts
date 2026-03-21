import { describe, expect, test } from "vitest";

import { analyzeClaimsLeakage, parseClaimsCsv } from "@/services/analyze-claims-leakage";

const validCsv = `claim_id,policy_id,claimant_name,cause_of_loss,loss_date,notified_date,reserve_gbp,incurred_gbp,paid_gbp,status
CLM-1001,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-10,95000,162000,88000,Open
CLM-1002,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-12,82000,140000,73000,Open
CLM-2004,POL-410,Northstar Logistics,Third-party Injury,2026-02-14,2026-02-20,240000,315000,150000,Reopened`;

describe("parseClaimsCsv", () => {
  test("parses valid rows", () => {
    const parsed = parseClaimsCsv(validCsv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(3);
  });

  test("returns required-column error", () => {
    const parsed = parseClaimsCsv("claim_id,policy_id\nCLM-1,POL-1\nCLM-2,POL-2\nCLM-3,POL-3");
    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("analyzeClaimsLeakage", () => {
  test("detects deterministic leakage indicators and rule counts", () => {
    const result = analyzeClaimsLeakage(validCsv, "which claims need review");
    expect(result.validationErrors).toEqual([]);
    expect(result.insight.summary.flaggedClaims).toBeGreaterThan(0);
    expect(result.insight.ruleCounts.some((rule) => rule.code === "reserve_inadequacy")).toBe(true);
    expect(result.insight.queryHits.length).toBeGreaterThan(0);
  });
});

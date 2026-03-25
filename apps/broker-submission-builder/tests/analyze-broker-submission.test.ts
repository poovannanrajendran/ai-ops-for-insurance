import { describe, expect, test } from "vitest";

import {
  analyzeBrokerSubmission,
  parseBrokerSubmission
} from "@/services/analyze-broker-submission";

const readySubmission = `Broker: Aegis Specialty Partners
Insured Name: Northbridge Food Ingredients Ltd
Class of Business: Property
Territory: United Kingdom and Ireland
Inception Date: 2026-07-01
Requested Limit: GBP 5,000,000
Attachment: GBP 500,000
Estimated Premium: GBP 185,000
Revenue: GBP 42,000,000
Occupancies: Dry food blending, packaging, and warehouse distribution
Claims Summary: No material losses in the past five years; one attritional stock spill closed below deductible.
Security Requirements: LPCB alarm, full perimeter CCTV, monitored sprinkler protection, and segregated combustible storage.
Target Quote By: 2026-04-04
Narrative: Established ingredient blender supplying private-label retail contracts from two sprinklered sites. Management confirms no change in process hazard, no overseas exports outside Ireland, and a planned renewal remarket to secure broader stock throughput wording.`;

const referralSubmission = `Broker: Meridian Wholesale Risks
Insured Name: HarborGlow Nutrition Inc.
Class of Business: Product Liability
Territory: United States and Canada
Inception Date: 2026-06-15
Requested Limit: GBP 20,000,000
Attachment: GBP 250,000
Estimated Premium: GBP 1,150,000
Revenue: GBP 180,000,000
Occupancies: Nutritional supplements manufacturing, contract packing, and North American distribution
Claims Summary: Two open bodily injury matters and one 2025 product recall remain under active defence with incurred spend above USD 3,200,000.
Security Requirements: Batch traceability in place, but third-party plant audit remediation and supplier contamination testing remain in progress.
Target Quote By: 2026-03-29
Narrative: Broker is seeking a new lead after incumbent reduced appetite. The insured is pressing for urgent turnaround to satisfy distributor covenant requirements while quality assurance upgrades and supplier testing actions are still being completed after the recall event.`;

describe("parseBrokerSubmission", () => {
  test("parses a valid broker note into structured fields", () => {
    const parsed = parseBrokerSubmission(readySubmission);

    expect(parsed.missing).toEqual([]);
    expect(parsed.fields.broker).toBe("Aegis Specialty Partners");
    expect(parsed.fields.requestedLimitGbp).toBe(5000000);
    expect(parsed.completenessPct).toBe(100);
  });

  test("returns missing required labels for incomplete notes", () => {
    const parsed = parseBrokerSubmission(`Broker: Example Wholesale
Insured Name: Example Manufacturing Ltd
Class of Business: Property
Requested Limit: GBP 3,000,000
Narrative: Short note only.`);

    expect(parsed.missing).toContain("Territory");
    expect(parsed.missing).toContain("Claims Summary");
    expect(parsed.missing).toContain("Target Quote By");
  });
});

describe("analyzeBrokerSubmission", () => {
  test("builds a ready-to-market submission for a complete property note", () => {
    const result = analyzeBrokerSubmission(readySubmission, "What should appear in the market summary?");

    expect(result.missing).toEqual([]);
    expect(result.insight.summary.readiness).toBe("ready");
    expect(result.insight.summary.referralCount).toBe(0);
    expect(result.insight.sections).toHaveLength(4);
    expect(result.insight.queryHits.length).toBeGreaterThan(0);
  });

  test("raises deterministic referral flags for a higher hazard liability note", () => {
    const result = analyzeBrokerSubmission(referralSubmission, "Why does this need referral?");

    expect(result.missing).toEqual([]);
    expect(result.insight.summary.readiness).toBe("referral");
    expect(result.insight.summary.redFlagCount).toBeGreaterThan(0);
    expect(result.insight.referralFlags.some((flag) => flag.code === "large_line_request")).toBe(true);
    expect(result.insight.referralFlags.some((flag) => flag.code === "adverse_claims_history")).toBe(
      true
    );
  });
});

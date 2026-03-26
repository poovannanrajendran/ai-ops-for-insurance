import { describe, expect, it } from "vitest";

import { analyzeRenewalCopilot } from "@/services/analyze-renewal-copilot";

const validRenewal = `INSURED: Meridian Foods Plc
CLASS: Property
BROKER: Aegis Specialty Partners
POLICY PERIOD: 2026-07-01 to 2027-06-30
CURRENT PREMIUM GBP: 185000
PRIOR YEAR PREMIUM GBP: 178000
LOSS RATIO PCT: 42
CLAIMS TREND: Stable frequency with one moderate machinery claim
EXPOSURE CHANGE PCT: 6
RISK CONTROLS: Upgraded alarm monitoring, quarterly engineering survey complete
MARKET CONDITIONS: Capacity available but underwriter caution on food processing fire loads
INSURED VALUE GBP: 42000000
LIMIT GBP: 5000000
EML GBP: 2900000
DEDUCTIBLE GBP: 50000
LTA: Not in place
TARGET EFFECTIVE DATE: 2026-07-01
BROKER OBJECTIVE: Secure stable terms and avoid deductible increase`;

describe("analyzeRenewalCopilot", () => {
  it("builds strategy memo and pricing signal outputs", () => {
    const result = analyzeRenewalCopilot(validRenewal, "What pricing direction is recommended?");
    expect(result.missing.length).toBe(0);
    expect(result.insight.strategyMemo).toHaveLength(6);
    expect(result.insight.negotiationTalkingPoints).toHaveLength(6);
    expect(result.insight.actionPlan).toHaveLength(7);
    expect(result.insight.pricingSignals).toHaveLength(7);
    expect(result.insight.whitespaceRows).toHaveLength(12);
    expect(result.insight.summary.technicalRateAdequacyPct).toBe(35);
    expect(result.insight.renewalStrategy.strategy).toBe("renew_flat");
    expect(result.insight.whitespaceRows.some((row) => row.fieldWording === "EML (GBP)")).toBe(true);
  });

  it("returns missing field list for incomplete renewal packs", () => {
    const result = analyzeRenewalCopilot(`INSURED: Short Note Co\nCLASS: Property\nCURRENT PREMIUM GBP:`);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.insight.warnings.some((warning) => warning.includes("Missing required renewal fields"))).toBe(true);
  });

  it("escalates to senior referral on stressed loss ratio and EML pressure", () => {
    const stressed = `INSURED: Atlas Marine Logistics
CLASS: Marine Cargo
CURRENT PREMIUM GBP: 420000
LOSS RATIO PCT: 89
CLAIMS TREND: Frequency increase with two theft losses and one high-severity spoilage event
EXPOSURE CHANGE PCT: 14
RISK CONTROLS: Incomplete route-security evidence and delayed control attestation
MARKET CONDITIONS: Capacity tightening and elevated deductible appetite in segment
LIMIT GBP: 9000000
EML GBP: 7800000
TARGET EFFECTIVE DATE: 2026-06-15
BROKER OBJECTIVE: Retain line size while preventing punitive premium movement`;
    const result = analyzeRenewalCopilot(stressed, "what should be escalated");
    expect(result.insight.renewalStrategy.strategy).toBe("refer_to_senior");
    expect(result.insight.summary.recommendedMovementPct).toBeGreaterThanOrEqual(5);
  });
});

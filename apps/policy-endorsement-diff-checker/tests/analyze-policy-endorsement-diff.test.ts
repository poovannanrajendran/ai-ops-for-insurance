import { describe, expect, test } from "vitest";

import { analyzePolicyEndorsementDiff } from "@/services/analyze-policy-endorsement-diff";

const expiringText = `Policy Reference: PROP-44812
Class: Property
Territory: United Kingdom, Ireland, France, Germany
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 25,000 each and every loss
Cyber Exclusion: Silent cyber carve-back for physical damage is included`;

const renewalText = `Policy Reference: PROP-44812
Class: Property
Territory: United Kingdom and Ireland only
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 100,000 each and every loss
Cyber Exclusion: Absolute cyber exclusion applies with no carve-back
Claims Notification: Notify all losses within 14 days`;

describe("analyzePolicyEndorsementDiff", () => {
  test("flags high-severity restrictive changes", () => {
    const result = analyzePolicyEndorsementDiff(expiringText, renewalText, "What changed materially?");

    expect(result.summary.materialChangeCount).toBeGreaterThan(0);
    expect(result.summary.highSeverityCount).toBeGreaterThan(0);
    expect(result.clauseDiffs.some((item) => item.label === "Territory" && item.severity === "high")).toBe(true);
    expect(result.clauseDiffs.some((item) => item.label === "Deductible" && item.severity === "high")).toBe(true);
  });

  test("captures added renewal clauses", () => {
    const result = analyzePolicyEndorsementDiff(expiringText, renewalText);
    const claimsNotification = result.clauseDiffs.find((item) => item.label === "Claims Notification");

    expect(claimsNotification?.changeType).toBe("added");
    expect(claimsNotification?.severity).toBe("high");
  });
});

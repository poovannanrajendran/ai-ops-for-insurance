import { buildReferralQueueInsight } from "../src/services/score-referrals";
import { describe, expect, it } from "vitest";

const criticalQueue = `referral_id\tinsured_name\tclass_of_business\tterritory\tquoted_premium_gbp\ttiv_gbp\tloss_ratio_pct\tdays_to_inception\tmissing_fields_count\tnew_business\tclaims_activity\tsanctions_flag\treferral_reason\tbroker_tier
RQ-901\tNorthshore Tank Storage\tProperty\tUnited Kingdom\t285000\t78000000\t96\t4\t3\ttrue\ttrue\tfalse\tcapacity reduction and aggregate pressure\tSilver
RQ-904\tAtlas Engineering LLC\tEnergy\tKazakhstan\t410000\t95000000\t88\t6\t4\ttrue\ttrue\ttrue\tsanctions screening hit and claims deterioration\tSilver
RQ-903\tBaltic Components Group\tCasualty\tPoland; Germany\t92000\t12000000\t38\t21\t1\tfalse\tfalse\tfalse\tloss record clarification pending\tGold`;

describe("buildReferralQueueInsight", () => {
  it("ranks the highest-risk referral first", () => {
    const insight = buildReferralQueueInsight(criticalQueue, "Which referrals need immediate escalation?");

    expect(insight.summary.queueCount).toBe(3);
    expect(insight.rankedReferrals[0]?.referral.referralId).toBe("RQ-904");
    expect(insight.rankedReferrals[0]?.urgencyBand).toBe("critical");
    expect(insight.warnings.some((warning) => warning.code === "sanctions_present")).toBe(true);
  });

  it("returns routine items when signals are light", () => {
    const insight = buildReferralQueueInsight(`referral_id\tinsured_name\tclass_of_business\tterritory\tquoted_premium_gbp\ttiv_gbp\tloss_ratio_pct\tdays_to_inception\tmissing_fields_count\tnew_business\tclaims_activity\tsanctions_flag\treferral_reason\tbroker_tier
RQ-101\tElm Catering\tCasualty\tUnited Kingdom\t42000\t3000000\t22\t48\t0\tfalse\tfalse\tfalse\tminor clarification\tGold
RQ-102\tCanal Offices Ltd\tProperty\tUnited Kingdom\t51000\t4000000\t18\t44\t1\tfalse\tfalse\tfalse\trenewal sign-off\tGold`);

    expect(insight.summary.criticalCount).toBe(0);
    expect(insight.rankedReferrals.every((item) => item.urgencyBand === "routine")).toBe(true);
  });

  it("throws when required headers are missing", () => {
    expect(() =>
      buildReferralQueueInsight(`referral_id\tinsured_name\tclass_of_business\nRQ-001\tShort Example\tProperty\nRQ-002\tAnother\tCasualty`)
    ).toThrow(/missing required column/i);
  });
});

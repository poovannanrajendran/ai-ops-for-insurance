import { describe, expect, it } from "vitest";

import { analyzeQbrNarrative } from "@/services/analyze-qbr-narrative";

describe("analyzeQbrNarrative", () => {
  it("returns improving state for strong quarter inputs", () => {
    const insight = analyzeQbrNarrative({
      qbrText:
        "gwp_gbp=12000000\nloss_ratio_pct=53\nntu_rate_pct=11\ncombined_ratio_pct=93\npremium_delta_pct=6\nrenewal_retention_pct=89\nopen_claims_count=18\nbroker_mix_note=Diversified broker panel.",
      sourceLabel: "balanced.txt",
      question: "What narrative should we use?"
    });

    expect(insight.summary.performanceState).toBe("improving");
    expect(insight.summary.completenessPct).toBe(100);
    expect(insight.warnings).toHaveLength(0);
  });

  it("surfaces warnings and missing statuses when fields are absent", () => {
    const insight = analyzeQbrNarrative({
      qbrText: "gwp_gbp=\nloss_ratio_pct=77\nntu_rate_pct=18\nbroker_mix_note=Partial pack.",
      sourceLabel: "partial.txt",
      question: "What is missing?"
    });

    expect(insight.summary.performanceState).toBe("deteriorating");
    expect(insight.warnings.length).toBeGreaterThan(0);
    expect(insight.whitespaceRows.some((row) => row.status === "MISSING")).toBe(true);
  });
});

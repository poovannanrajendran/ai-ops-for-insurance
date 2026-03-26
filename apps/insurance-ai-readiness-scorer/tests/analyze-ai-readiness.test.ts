import { describe, expect, it } from "vitest";

import { analyzeAiReadiness } from "@/services/analyze-ai-readiness";

describe("analyzeAiReadiness", () => {
  it("scores a complete payload and returns roadmap items", () => {
    const { analysis } = analyzeAiReadiness({
      sourceLabel: "sample.txt",
      assessmentText:
        "sponsor=COO\ntarget_domains=UW and Claims\ndata_foundation=Curated warehouse\ngovernance=Quarterly oversight\noperating_model=Hub and spoke\ntooling=Model gateway\nskills=Cross-functional team\nuse_case_1=Referral triage\nstrength_1=Strong sponsor\nplan_1=Run controls pilot",
      prompt: "What should leadership prioritise?"
    });

    expect(analysis.summary.readinessScore).toBeGreaterThan(0);
    expect(analysis.summary.readinessBand).toMatch(/Foundational|Scaling|Transforming/);
    expect(analysis.ninetyDayPlan.length).toBeGreaterThan(0);
  });

  it("returns blocked status for incomplete input", () => {
    const { analysis } = analyzeAiReadiness({
      sourceLabel: "missing.txt",
      assessmentText: "sponsor=\nuse_case_1=Draft",
      prompt: "Can we score this now?"
    });

    expect(analysis.summary.completenessPct).toBeLessThan(65);
    expect(analysis.summary.status).toBe("blocked");
  });
});


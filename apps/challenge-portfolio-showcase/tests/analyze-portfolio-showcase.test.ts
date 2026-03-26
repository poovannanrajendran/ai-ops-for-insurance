import { describe, expect, it } from "vitest";

import { analyzePortfolioShowcase } from "@/services/analyze-portfolio-showcase";

describe("analyzePortfolioShowcase", () => {
  it("scores a complete payload and returns next actions", () => {
    const { analysis } = analyzePortfolioShowcase({
      sourceLabel: "sample.txt",
      showcaseText:
        "challenge_name=30 Useful Insurance and Productivity Apps\napps_completed=29\ndomain_coverage=UW, Claims, Exposure\noutcomes=Live deployments\ndeployment_status=Live\nevidence_links=GitHub and Vercel\nnext_focus=Day 30 launch\nstory_hook=Built in 30 days\nstrength_1=Strong QA\nnext_1=Publish launch post",
      prompt: "What should leadership emphasise?"
    });

    expect(analysis.summary.showcaseScore).toBeGreaterThan(0);
    expect(analysis.summary.showcaseBand).toMatch(/Foundation|Momentum|Portfolio-Ready/);
    expect(analysis.nextActions.length).toBeGreaterThan(0);
  });

  it("returns blocked status for incomplete input", () => {
    const { analysis } = analyzePortfolioShowcase({
      sourceLabel: "missing.txt",
      showcaseText: "challenge_name=\noutcomes=Draft",
      prompt: "Can we publish now?"
    });

    expect(analysis.summary.completenessPct).toBeLessThan(65);
    expect(analysis.summary.status).toBe("blocked");
  });
});

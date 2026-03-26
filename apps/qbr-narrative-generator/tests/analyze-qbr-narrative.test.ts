import { describe, expect, it } from "vitest";

import { analyzeQbrNarrative } from "@/services/analyze-qbr-narrative";

describe("analyzeQbrNarrative", () => {
  it("builds enriched narrative using company, quarter, class, large loss, new business, and market context", () => {
    const insight = analyzeQbrNarrative({
      qbrText: [
        "company_name=Aegis Specialty Underwriting Ltd",
        "class_of_business=Property & Marine Combined",
        "quarter=Q1 2026",
        "gwp_gbp=14200000",
        "loss_ratio_pct=56",
        "ntu_rate_pct=12",
        "combined_ratio_pct=94",
        "premium_delta_pct=8",
        "renewal_retention_pct=91",
        "open_claims_count=11",
        "large_loss_count=1",
        "new_business_gwp_gbp=2100000",
        "broker_mix_note=Majority London wholesale panel with two strategic regional brokers.",
        "market_conditions_note=Property market stable to slightly hardening; marine cargo capacity tightening post Red Sea disruption."
      ].join("\n"),
      sourceLabel: "aegis-q1.txt",
      question: "What should the board narrative focus on this quarter?"
    });

    expect(insight.summary.performanceState).toBe("improving");
    expect(insight.summary.completenessPct).toBe(100);

    expect(insight.executiveNarrative[0]).toContain("Aegis Specialty Underwriting Ltd");
    expect(insight.executiveNarrative[0]).toContain("for Q1 2026");
    expect(insight.executiveNarrative[0]).toContain("(Property & Marine Combined)");
    expect(insight.executiveNarrative.join(" ")).toContain("New business contributed GBP 2,100,000 GWP this quarter");

    expect(insight.boardTalkingPoints.join(" ")).toContain("1 large loss(es) active");
    expect(insight.boardTalkingPoints.join(" ")).toContain("Market context:");

    const optionalMarketRow = insight.whitespaceRows.find((r) => r.fieldWording === "Market conditions note");
    expect(optionalMarketRow?.optional).toBe(true);
    expect(optionalMarketRow?.status).toBe("EXTRACTED");

    expect(insight.warnings.some((w) => w.includes("Company name"))).toBe(false);
  });

  it("surfaces warnings for missing mandatory fields while keeping optional fields non-blocking", () => {
    const insight = analyzeQbrNarrative({
      qbrText: [
        "company_name=",
        "class_of_business=Marine Cargo",
        "quarter=Q2 2026",
        "gwp_gbp=",
        "loss_ratio_pct=77",
        "ntu_rate_pct=18",
        "combined_ratio_pct=105",
        "premium_delta_pct=-6",
        "renewal_retention_pct=69",
        "open_claims_count=23",
        "broker_mix_note=Partial pack only"
      ].join("\n"),
      sourceLabel: "incomplete.txt",
      question: "What is missing and what should be fixed?"
    });

    expect(insight.summary.performanceState).toBe("deteriorating");
    expect(insight.warnings.some((w) => w.includes("Company name not provided"))).toBe(true);
    expect(insight.warnings.some((w) => w.includes("Missing numeric fields"))).toBe(true);

    const companyRow = insight.whitespaceRows.find((r) => r.fieldWording === "Company / division");
    const marketRow = insight.whitespaceRows.find((r) => r.fieldWording === "Market conditions note");

    expect(companyRow?.status).toBe("MISSING");
    expect(companyRow?.optional).toBe(false);
    expect(marketRow?.optional).toBe(true);
    expect(marketRow?.status).toBe("MISSING");
  });
});

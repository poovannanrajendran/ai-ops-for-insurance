import { describe, expect, test } from "vitest";

import { analyzeExposureScenario, parseExposureScenarioCsv } from "@/services/analyze-exposure-scenario";

const validCsv = `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1,Atlas Ports,Netherlands,Flood,Property,9100000,500000,4200000
EXP-2,Atlas Ports,Netherlands,Flood,Property,8400000,450000,3900000
EXP-3,Harbor Cold Chain,Netherlands,Windstorm,Property,5200000,300000,2600000
EXP-4,Rhine Manufacturing,Germany,Fire,Property,4300000,200000,2200000`;

describe("parseExposureScenarioCsv", () => {
  test("parses valid rows", () => {
    const parsed = parseExposureScenarioCsv(validCsv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(4);
    expect(parsed.rows[0]?.country).toBe("Netherlands");
  });

  test("returns required-column error", () => {
    const parsed = parseExposureScenarioCsv("exposure_id,account_name\nEXP-1,Atlas\nEXP-2,Atlas\nEXP-3,Atlas");
    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("analyzeExposureScenario", () => {
  test("models deterministic baseline and stressed scenarios", () => {
    const result = analyzeExposureScenario(validCsv, "show the Netherlands concentration");
    const countryInsight = result.analysis.concentrationInsights.find(
      (insight) => insight.dimension === "country" && insight.label === "Netherlands"
    );

    expect(result.validationErrors).toEqual([]);
    expect(result.analysis.summary.rowCount).toBe(4);
    expect(result.analysis.summary.gatePassed).toBe(true);
    expect(result.analysis.scenarios).toHaveLength(2);
    expect(result.analysis.scenarios[1]?.netModelledLossGbp).toBeGreaterThan(
      result.analysis.scenarios[0]?.netModelledLossGbp ?? 0
    );
    expect(countryInsight).toBeDefined();
    expect(result.analysis.querySnippets.length).toBeGreaterThan(0);
  });

  test("fails the required-field gate when a required value is blank", () => {
    const incompleteCsv = `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1,Atlas Ports,Netherlands,Flood,Property,9100000,500000,4200000
EXP-2,Atlas Ports,,Flood,Property,8400000,450000,3900000
EXP-3,Harbor Cold Chain,Netherlands,Windstorm,Property,5200000,300000,2600000`;

    const result = analyzeExposureScenario(incompleteCsv);
    expect(result.validationErrors[0]).toContain("Missing analytical coverage");
    expect(result.analysis.requiredFieldGate.passed).toBe(false);
  });
});

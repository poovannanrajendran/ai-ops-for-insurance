import { describe, expect, test } from "vitest";

import { analyzeBinderCapacityCsv, parseBinderCsv } from "@/services/analyze-binder-capacity";

const validCsv = `risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp,binder_capacity_gbp,forecast_additional_gbp,days_to_expiry,status
R-201,Atlas Foods Europe,Continental Trade,Property,France,5400000,10000000,600000,68,Bound
R-202,Delta Components,Continental Trade,Property,Germany,2100000,10000000,300000,55,Bound
R-203,Medline Wholesale,Continental Trade,Casualty,France,600000,10000000,850000,26,Quoted
R-204,Orbital Logistics,Continental Trade,Marine Cargo,Belgium,550000,10000000,900000,19,Quoted
R-205,Vega Mobility,Continental Trade,Property,France,450000,10000000,700000,12,Quoted`;

describe("parseBinderCsv", () => {
  test("parses valid binder rows", () => {
    const parsed = parseBinderCsv(validCsv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(5);
    expect(parsed.rows[0]?.binderName).toBe("Continental Trade");
  });

  test("fails when a fuller dataset is not provided", () => {
    const parsed = parseBinderCsv("risk_id,insured_name\nR-1,Short");

    expect(parsed.errors[0]).toContain("Provide at least one header row and two data rows");
  });

  test("fails when required columns are missing from a multi-row payload", () => {
    const parsed = parseBinderCsv("risk_id,insured_name\nR-1,Short\nR-2,Shorter");

    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("analyzeBinderCapacityCsv", () => {
  test("returns forecast breach warnings and red/amber bands deterministically", () => {
    const analysis = analyzeBinderCapacityCsv(validCsv, "Will the binder breach on forecast?");

    expect(analysis.summary.binderName).toBe("Continental Trade");
    expect(analysis.summary.usedPct).toBe(91);
    expect(analysis.summary.forecastUsedPct).toBe(124.5);
    expect(analysis.summary.currentBand).toBe("red");
    expect(analysis.summary.breachRisk).toBe("likely_breach");
    expect(analysis.warnings.some((warning) => warning.code === "forecast_breach")).toBe(true);
    expect(analysis.classBreakdown[0]?.label).toBe("Property");
    expect(analysis.territoryBreakdown[0]?.label).toBe("France");
  });
});

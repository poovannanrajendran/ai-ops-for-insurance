import { describe, expect, it } from "vitest";

import { analyzeDataQuality } from "@/services/analyze-data-quality";

const validDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
SUB-1001,Property,United Kingdom,185000,2026-01-01,2026-12-31
SUB-1002,Casualty,France,92000,2026-02-01,2027-01-31`;

describe("analyzeDataQuality", () => {
  it("builds summary and issue outputs for valid datasets", () => {
    const result = analyzeDataQuality(validDataset, "Any validation concerns?");
    expect(result.missing.length).toBe(0);
    expect(result.insight.summary.rowsEvaluated).toBe(2);
    expect(result.insight.whitespaceRows.some((row) => row.fieldWording === "record_id")).toBe(true);
  });

  it("returns missing field list when required columns are absent", () => {
    const result = analyzeDataQuality(`record_id,class_of_business,country,premium_gbp,inception_date\nSUB-1,Property,UK,10,2026-01-01`);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.insight.warnings.some((warning) => warning.includes("Missing required columns"))).toBe(true);
  });
});

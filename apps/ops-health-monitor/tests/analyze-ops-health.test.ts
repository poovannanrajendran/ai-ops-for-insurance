import { describe, expect, it } from "vitest";

import { analyzeOpsHealth } from "@/services/analyze-ops-health";

const validKpis = `kpi,current,target,previous,owner,direction
Quote turnaround hours,31,30,32,Broking Ops,lower_better
Referral aging over 5d,11,10,12,Underwriting Ops,lower_better
Bind ratio pct,34,36,33,Placement,higher_better`;

describe("analyzeOpsHealth", () => {
  it("builds KPI board, anomalies, and whitespace outputs", () => {
    const result = analyzeOpsHealth(validKpis, "Which referral KPI is off target?");
    expect(result.missing.length).toBe(0);
    expect(result.insight.metricBoard.length).toBe(3);
    expect(result.insight.summary.metricsEvaluated).toBe(3);
    expect(result.insight.whitespaceRows.some((row) => row.fieldWording.includes("Quote turnaround"))).toBe(true);
  });

  it("returns missing field list for incomplete KPI data", () => {
    const result = analyzeOpsHealth(`kpi,current,target,previous,owner,direction\nQuote turnaround hours,52,,41,Broking Ops,lower_better`);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.insight.warnings.some((warning) => warning.includes("Missing required KPI fields"))).toBe(true);
  });
});

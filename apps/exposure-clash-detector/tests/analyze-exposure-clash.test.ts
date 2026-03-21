import { describe, expect, test } from "vitest";

import { analyzeExposureClash, parseExposureSchedules } from "@/services/analyze-exposure-clash";

const validCsv = `schedule_id,policy_id,insured_name,location,country,peril,period_start,period_end,tiv_gbp,limit_gbp
SCHED-A,POL-001,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-01-01,2026-12-31,8500000,5000000
SCHED-B,POL-774,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-03-01,2026-11-30,7200000,4500000
SCHED-B,POL-778,Delta Cold Chain,Hamburg Hub,Germany,Fire,2026-01-01,2026-12-31,3100000,1800000`;

describe("parseExposureSchedules", () => {
  test("parses valid rows", () => {
    const parsed = parseExposureSchedules(validCsv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(3);
  });

  test("returns required-column error", () => {
    const parsed = parseExposureSchedules("schedule_id,policy_id\nA,B\nC,D\nE,F");
    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("analyzeExposureClash", () => {
  test("detects deterministic overlaps and severity", () => {
    const result = analyzeExposureClash(validCsv, "highest country concentration");
    expect(result.validationErrors).toEqual([]);
    expect(result.insight.summary.clashesDetected).toBe(1);
    expect(result.insight.summary.highSeverityClashes).toBe(1);
    expect(result.insight.countryConcentration[0]?.label).toBe("Netherlands");
    expect(result.insight.queryHits.length).toBeGreaterThan(0);
  });
});

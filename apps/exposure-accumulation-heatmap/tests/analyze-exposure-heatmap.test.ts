import { analyzeExposureCsv, parseExposureCsv } from "@/services/analyze-exposure-heatmap";
import { describe, expect, test } from "vitest";

const validCsv = [
  "location_id,country,latitude,longitude,tiv,peril",
  "LOC-UK-001,United Kingdom,51.5074,-0.1278,12000000,Windstorm",
  "LOC-UK-002,United Kingdom,52.4862,-1.8904,8000000,Flood",
  "LOC-NL-001,Netherlands,52.3676,4.9041,5000000,Flood",
  "LOC-DE-001,Germany,50.1109,8.6821,4500000,Hail",
  "LOC-FR-001,France,48.8566,2.3522,4000000,Windstorm"
].join("\n");

describe("parseExposureCsv", () => {
  test("parses valid csv rows", () => {
    const parsed = parseExposureCsv(validCsv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(5);
    expect(parsed.rows[0]?.locationId).toBe("LOC-UK-001");
  });

  test("fails when required columns are missing", () => {
    const parsed = parseExposureCsv("country,latitude\nUnited Kingdom,51.5");
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("analyzeExposureCsv", () => {
  test("returns summary and hotspot data", () => {
    const analysis = analyzeExposureCsv(validCsv, "country concentration");

    expect(analysis.summary.rowCount).toBe(5);
    expect(analysis.summary.totalTiv).toBe(33500000);
    expect(analysis.hotspots.length).toBeGreaterThan(0);
    expect(analysis.countryConcentration[0]?.label).toBe("United Kingdom");
  });

  test("raises warning when single country concentration is high", () => {
    const concentratedCsv = [
      "location_id,country,latitude,longitude,tiv",
      "LOC-1,United States,40.71,-74.00,25000000",
      "LOC-2,United States,34.05,-118.24,18000000",
      "LOC-3,United States,29.76,-95.36,14000000",
      "LOC-4,Canada,43.65,-79.38,6000000",
      "LOC-5,Mexico,19.43,-99.13,4500000"
    ].join("\n");

    const analysis = analyzeExposureCsv(concentratedCsv);

    expect(analysis.warnings.some((warning) => warning.code === "high_country_concentration")).toBe(true);
  });
});

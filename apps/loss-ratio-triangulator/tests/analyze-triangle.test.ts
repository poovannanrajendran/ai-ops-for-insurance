import { describe, expect, it } from "vitest";

import { analyzeTriangle } from "@/services/analyze-triangle";

describe("analyzeTriangle", () => {
  it("computes LDFs and summary from cumulative triangle", () => {
    const insight = analyzeTriangle({
      triangleText: "AY,12,24,36\n2021,100,180,240\n2022,120,210,\n2023,140,,",
      sourceLabel: "triangle.csv",
      question: "where is ibnr"
    });

    expect(insight.ldfs.length).toBe(2);
    expect(insight.summary.totalUltimate).toBeGreaterThanOrEqual(insight.summary.totalPaid);
    expect(insight.summary.completenessPct).toBeGreaterThan(40);
  });

  it("applies tail factor when provided", () => {
    const withoutTail = analyzeTriangle({
      triangleText: "AY,12,24,36\n2021,100,180,240\n2022,120,210,\n2023,140,,"
    });
    const withTail = analyzeTriangle({
      triangleText: "tail_factor=1.1\nAY,12,24,36\n2021,100,180,240\n2022,120,210,\n2023,140,,"
    });

    expect(withTail.summary.totalUltimate).toBeGreaterThan(withoutTail.summary.totalUltimate);
    expect(withTail.summary.tailFactor).toBe(1.1);
  });

  it("parses incremental rows by cumulating values", () => {
    const insight = analyzeTriangle({
      triangleText: "AY,12,24,36\n2021,100,80,60\n2022,120,90,\n2023,140,,"
    });

    expect(insight.triangle.inputType).toBe("incremental");
    expect(insight.triangle.cells[0][1]).toBe(180);
    expect(insight.triangle.cells[0][2]).toBe(240);
  });

  it("throws for insufficient triangle size", () => {
    expect(() => analyzeTriangle({ triangleText: "2021,120" })).toThrow();
  });

  it("returns warnings for short tail and sparse transitions", () => {
    const insight = analyzeTriangle({
      triangleText: "AY,12,24\n2021,100,130\n2022,120,\n2023,140,"
    });

    expect(insight.summary.warnings.some((line) => line.toLowerCase().includes("tail"))).toBe(true);
    expect(insight.summary.warnings.some((line) => line.toLowerCase().includes("sparse"))).toBe(true);
  });
});

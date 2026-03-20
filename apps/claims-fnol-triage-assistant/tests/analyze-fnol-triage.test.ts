import { describe, expect, test } from "vitest";

import { analyzeFnolTriage } from "@/services/analyze-fnol-triage";
import { demoSamples } from "@/lib/demo-samples";

describe("analyzeFnolTriage", () => {
  test("classifies low-severity property loss as fast-track", () => {
    const result = analyzeFnolTriage(demoSamples[0].fnolText, demoSamples[0].question);

    expect(result.summary.disposition).toBe("fast-track");
    expect(result.summary.triageScore).toBeLessThan(30);
    expect(result.warnings.length).toBe(0);
  });

  test("classifies represented injury claim as escalate", () => {
    const result = analyzeFnolTriage(demoSamples[2].fnolText, demoSamples[2].question);

    expect(result.summary.disposition).toBe("escalate");
    expect(result.factors.some((factor) => factor.code === "injury")).toBe(true);
    expect(result.factors.some((factor) => factor.code === "litigation")).toBe(true);
  });

  test("routes moderate theft loss to manual-review", () => {
    const result = analyzeFnolTriage(demoSamples[1].fnolText, demoSamples[1].question);

    expect(result.summary.disposition).toBe("manual-review");
    expect(result.factors.some((factor) => factor.code === "reserve")).toBe(true);
  });
});

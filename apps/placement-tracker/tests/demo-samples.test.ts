import { describe, expect, test } from "vitest";

import { demoSamples } from "@/lib/demo-samples";
import { buildPlacementInsight } from "@/services/analyze-placement";

describe("day18 demo samples", () => {
  test("includes the new multi-class and near-full placement presets", () => {
    expect(demoSamples.some((sample) => sample.id === "multi-class-programme")).toBe(true);
    expect(demoSamples.some((sample) => sample.id === "near-full-placement")).toBe(true);
  });

  test("new presets run through deterministic analysis", () => {
    const multiClass = demoSamples.find((sample) => sample.id === "multi-class-programme");
    const nearFull = demoSamples.find((sample) => sample.id === "near-full-placement");

    expect(multiClass).toBeDefined();
    expect(nearFull).toBeDefined();

    const multiClassInsight = buildPlacementInsight(multiClass!.csvText, multiClass!.question);
    const nearFullInsight = buildPlacementInsight(nearFull!.csvText, nearFull!.question);

    expect(multiClassInsight.summary.totalMarkets).toBe(5);
    expect(multiClassInsight.priorityFlags.some((flag) => flag.code === "declined_line")).toBe(true);
    expect(nearFullInsight.summary.placedSharePct).toBe(95);
    expect(nearFullInsight.summary.openSharePct).toBe(5);
  });
});

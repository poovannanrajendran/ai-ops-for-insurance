import { analyzeCatEventText } from "@/services/analyze-cat-event";
import { describe, expect, test } from "vitest";

const highSeverityEvent = `
Event: Severe Atlantic Windstorm Iris
Date: 2026-03-18
Regions: United Kingdom, France, Netherlands
Synopsis: A major windstorm made landfall overnight with sustained winds above 120 mph and widespread infrastructure outage.
Authorities issued a state of emergency and evacuation orders in coastal zones with material losses expected.
`;

describe("analyzeCatEventText", () => {
  test("returns deterministic summary and briefing", () => {
    const analysis = analyzeCatEventText(highSeverityEvent, "Which classes need urgent referral?");

    expect(analysis.summary.peril).toBe("Windstorm");
    expect(analysis.summary.severityScore).toBeGreaterThanOrEqual(4);
    expect(analysis.summary.regionCount).toBeGreaterThanOrEqual(3);
    expect(analysis.affectedClasses.length).toBeGreaterThan(0);
    expect(analysis.briefing.facts.length).toBeGreaterThan(0);
  });

  test("raises accumulation warning for cross-region signals", () => {
    const analysis = analyzeCatEventText(highSeverityEvent);

    expect(analysis.warnings.some((warning) => warning.code === "cross_region_accumulation")).toBe(true);
  });

  test("flags uncertain data when peril/region signals are missing", () => {
    const analysis = analyzeCatEventText(
      "Event note: operational disruption observed. Monitoring continues with limited impact details."
    );

    expect(analysis.warnings.some((warning) => warning.code === "data_uncertain")).toBe(true);
  });
});

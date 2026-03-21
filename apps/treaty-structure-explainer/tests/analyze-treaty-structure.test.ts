import { describe, expect, test } from "vitest";

import { analyzeTreatyStructure } from "@/services/analyze-treaty-structure";

const treatyText = `Treaty Type: Excess of Loss
Subject Business: UK commercial property
Territory: United Kingdom
Attachment: GBP 2,500,000
Limit: GBP 7,500,000
Ceding Commission: 12.5%
Signed Share: 100%
Reinstatements: 1`;

describe("analyzeTreatyStructure", () => {
  test("parses deterministic treaty terms and scenarios", () => {
    const result = analyzeTreatyStructure(treatyText, "who pays above limit");

    expect(result.missing).toEqual([]);
    expect(result.insight.terms.treatyType).toBe("Excess of Loss");
    expect(result.insight.layerBands).toHaveLength(3);
    expect(result.insight.scenarios).toHaveLength(3);
    expect(result.insight.queryHits.length).toBeGreaterThan(0);
  });

  test("returns missing required fields for incomplete wording", () => {
    const result = analyzeTreatyStructure("Treaty Type: Excess of Loss\nSubject Business: Property");

    expect(result.missing).toContain("Attachment");
    expect(result.missing).toContain("Limit");
  });
});

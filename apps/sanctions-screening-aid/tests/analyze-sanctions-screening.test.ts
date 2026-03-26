import { describe, expect, it } from "vitest";

import { analyzeSanctionsScreening } from "@/services/analyze-sanctions-screening";

const validScreening = `insured_entity=Northbridge Food Ingredients Ltd
beneficial_owner=Meridian Holdings Plc
broker=Atlas Specialty Broker LLP
territory=United Kingdom; Ireland
counterparty=Harborline Logistics GmbH`;

describe("analyzeSanctionsScreening", () => {
  it("builds screening summary and match outputs", () => {
    const result = analyzeSanctionsScreening(validScreening, "Any review needed?");
    expect(result.missing.length).toBe(0);
    expect(result.insight.summary.entitiesScreened).toBe(5);
    expect(result.insight.whitespaceRows.some((row) => row.fieldWording === "insured_entity")).toBe(true);
  });

  it("returns missing required field list for incomplete packs", () => {
    const result = analyzeSanctionsScreening(`insured_entity=\nbeneficial_owner=ABC`);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.insight.warnings.some((warning) => warning.includes("Missing required screening fields"))).toBe(true);
  });
});

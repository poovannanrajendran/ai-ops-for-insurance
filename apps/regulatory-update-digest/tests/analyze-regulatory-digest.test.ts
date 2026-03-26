import { describe, expect, it } from "vitest";

import { analyzeRegulatoryDigest } from "@/services/analyze-regulatory-digest";

const balancedFeed = `SOURCE: Lloyd's Market Bulletin
TITLE: Claims data quality and bordereaux filing cadence update
DATE: 2026-02-18
CLASS: Property; Marine Cargo
UPDATE: Managing agents must evidence monthly bordereaux reconciliation controls and exception tracking by Q2 2026.
ACTION: Confirm bordereaux quality controls, assign owner, and prepare attestation notes.
---
SOURCE: FCA Handbook Notice
TITLE: Conduct expectations for product governance reviews
DATE: 2026-02-25
CLASS: Liability; Financial Lines
UPDATE: Firms should document annual product governance reviews with clear customer-outcome rationale and pricing evidence.
ACTION: Schedule governance review pack and capture pricing rationale in approval minutes.`;

describe("analyzeRegulatoryDigest", () => {
  it("extracts updates and ranks relevance deterministically", () => {
    const result = analyzeRegulatoryDigest(
      balancedFeed,
      "Property, Liability",
      "Which updates require governance action?"
    );

    expect(result.summary.bulletinCount).toBe(2);
    expect(result.summary.relevantCount).toBeGreaterThanOrEqual(1);
    expect(result.updates.length).toBe(2);
    expect(result.whitespaceRows.some((row) => row.fieldWording === "Bulletin count")).toBe(true);
  });

  it("flags missing required fields and minimum-feed gate gaps", () => {
    const thinResult = analyzeRegulatoryDigest(
      `SOURCE: Market Note
TITLE: Short update
DATE: 2026-03-15
CLASS:
UPDATE: Watch for changes.
ACTION: `,
      ""
    );

    expect(thinResult.warnings.some((warning) => warning.includes("Minimum two regulatory updates"))).toBe(true);
    expect(thinResult.warnings.some((warning) => warning.includes("missing required fields"))).toBe(true);
    expect(thinResult.warnings.some((warning) => warning.includes("Class focus is empty"))).toBe(true);
  });
});

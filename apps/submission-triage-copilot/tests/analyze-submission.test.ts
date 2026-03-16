import { analyzeSubmission } from "../src/services/analyze-submission";
import { describe, expect, it } from "vitest";

describe("analyzeSubmission", () => {
  it("accepts a simple UK property submission in the preferred band", () => {
    const analysis = analyzeSubmission(`
      Broker: Example Wholesale
      Insured Name: Example Manufacturing Ltd
      Territory: United Kingdom
      Class: Property
      Currency: GBP
      Limit: GBP 5,000,000
      Loss history: clean
    `);

    expect(analysis.decision).toBe("accept");
    expect(analysis.extracted.classOfBusiness).toBe("Property");
    expect(analysis.extracted.territory).toBe("United Kingdom");
  });

  it("declines cyber submissions in the MVP rules engine", () => {
    const analysis = analyzeSubmission(`
      Broker: Example Wholesale
      Insured Name: Example Technology Ltd
      Territory: Global
      Class: Cyber
      Currency: USD
      Limit: USD 15,000,000
      Notes: ransomware aggregation concern
    `);

    expect(analysis.decision).toBe("decline");
    expect(analysis.extracted.classOfBusiness).toBe("Cyber");
  });
});

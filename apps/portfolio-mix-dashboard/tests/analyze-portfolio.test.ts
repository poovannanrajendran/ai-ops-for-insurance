import { analyzePortfolio, buildConcentrationWarnings, buildPortfolioInsight, parsePortfolioCsv } from "../src/services/analyze-portfolio";
import { describe, expect, it } from "vitest";

describe("parsePortfolioCsv", () => {
  it("parses and normalizes a valid portfolio csv", () => {
    const records = parsePortfolioCsv(`account_name,class_of_business,territory,limit_amount,currency
Northwind Logistics,marine cargo,uk,2500000,gbp
Harbor Retail Group,property,usa,5000000,usd`);

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      accountName: "Northwind Logistics",
      classOfBusiness: "Marine Cargo",
      territory: "United Kingdom",
      limitAmount: 2_500_000,
      currency: "GBP"
    });
    expect(records[1].territory).toBe("United States");
  });

  it("supports alternate headers and currency embedded in the limit field", () => {
    const records = parsePortfolioCsv(`account,class,region,limit
Emerald Foods,product recall,europe,EUR 3,000,000`);

    expect(records[0]).toMatchObject({
      classOfBusiness: "Product Recall",
      territory: "Europe",
      limitAmount: 3_000_000,
      currency: "EUR"
    });
  });

  it("throws a clear error when required columns are missing", () => {
    expect(() =>
      parsePortfolioCsv(`account_name,currency
Northwind Logistics,GBP`)
    ).toThrow("CSV must include columns for class of business, territory, and limit amount.");
  });

  it("throws a clear error when a limit amount is invalid", () => {
    expect(() =>
      parsePortfolioCsv(`account_name,class_of_business,territory,limit_amount
Northwind Logistics,marine cargo,uk,not-a-number`)
    ).toThrow('Invalid limit amount: "not-a-number".');
  });
});

describe("analyzePortfolio", () => {
  it("builds distribution summaries for class, territory, and limit band", () => {
    const analysis = analyzePortfolio(`account_name,class_of_business,territory,limit_amount,currency
Northwind Logistics,Marine Cargo,United Kingdom,2500000,GBP
Harbor Retail Group,Property,United States,5000000,USD
Summit Energy,Property,United States,12000000,USD`);

    expect(analysis.summary.totalRecords).toBe(3);
    expect(analysis.summary.classDistribution).toEqual([
      { label: "Property", count: 2, share: 0.67 },
      { label: "Marine Cargo", count: 1, share: 0.33 }
    ]);
    expect(analysis.summary.territoryDistribution).toEqual([
      { label: "United States", count: 2, share: 0.67 },
      { label: "United Kingdom", count: 1, share: 0.33 }
    ]);
    expect(analysis.summary.limitBandDistribution).toEqual([
      { label: "1M to 5M", count: 2, share: 0.67 },
      { label: "Over 10M", count: 1, share: 0.33 }
    ]);
    expect(analysis.summary.currencies).toEqual(["GBP", "USD"]);
  });
});

describe("portfolio commentary and warnings", () => {
  it("creates concentration warnings for a highly concentrated portfolio", () => {
    const analysis = analyzePortfolio(`account_name,class_of_business,territory,limit_amount,currency
Atlas Towers,Property,United States,12000000,USD
Keystone Hospitality,Property,United States,15000000,USD
Beacon Living,Property,United States,11000000,USD
Blue Harbor Estates,Property,United States,9000000,USD
Crown Logistics,Marine Cargo,United Kingdom,2500000,GBP`);

    const warnings = buildConcentrationWarnings(analysis);

    expect(warnings.map((warning) => warning.dimension)).toEqual([
      "class",
      "territory",
      "limitBand"
    ]);
    expect(warnings[0]?.severity).toBe("high");
  });

  it("builds commentary and full insight payload", () => {
    const insight = buildPortfolioInsight(`account_name,class_of_business,territory,limit_amount,currency
Northwind Logistics,Marine Cargo,United Kingdom,2500000,GBP
Harbor Retail Group,Property,United States,5000000,USD
Emerald Foods,Product Recall,Europe,3000000,EUR`);

    expect(insight.commentary.executiveSummary).toContain("3 portfolio rows parsed");
    expect(insight.commentary.observations).toHaveLength(3);
    expect(insight.commentary.actions.length).toBeGreaterThan(0);
  });
});

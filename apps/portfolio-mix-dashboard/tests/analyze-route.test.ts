import { beforeEach, describe, expect, it, vi } from "vitest";

const hasSupabaseServerAccess = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const schema = vi.fn(() => ({ from }));
const createSupabaseServerClient = vi.fn(() => ({ schema }));
const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const createLogger = vi.fn(() => ({ info, warn, error, child: createLogger }));

vi.mock("@ai-ops/config", () => ({
  portfolioMixApp: {
    schema: "app_portfoliomix",
    shortName: "portfoliomix"
  },
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/portfoliomix/analyze", () => {
  beforeEach(() => {
    hasSupabaseServerAccess.mockReset();
    createSupabaseServerClient.mockClear();
    schema.mockClear();
    from.mockClear();
    insert.mockReset();
    createLogger.mockClear();
    info.mockClear();
    warn.mockClear();
    error.mockClear();
  });

  it("returns 400 for short csv input", async () => {
    const { POST } = await import("../src/app/api/portfoliomix/analyze/route");
    const request = new Request("http://localhost/api/portfoliomix/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: "too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide a CSV");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns analysis and warning data when persistence is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/portfoliomix/analyze/route");
    const request = new Request("http://localhost/api/portfoliomix/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: `account_name,class_of_business,territory,limit_amount,currency
Atlas Towers,Property,United States,12000000,USD
Keystone Hospitality,Property,United States,15000000,USD
Beacon Living,Property,United States,11000000,USD`,
        sourceLabel: "warning-demo.csv"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.totalRecords).toBe(3);
    expect(body.analysis.warnings.length).toBeGreaterThan(0);
    expect(body.analysis.commentary.executiveSummary).toContain("3 portfolio rows");
    expect(body.persistence.status).toBe("skipped");
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/portfoliomix/analyze/route");
    const request = new Request("http://localhost/api/portfoliomix/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: `account_name,class_of_business,territory,limit_amount,currency
Northwind Logistics,Marine Cargo,United Kingdom,2500000,GBP
Harbor Retail Group,Property,United States,5000000,USD`,
        sourceLabel: "balanced.csv"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(createSupabaseServerClient.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(schema).toHaveBeenCalledWith("app_portfoliomix");
    expect(from).toHaveBeenCalledWith("app_portfoliomix_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_portfoliomix_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 400 when csv columns are missing", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/portfoliomix/analyze/route");
    const request = new Request("http://localhost/api/portfoliomix/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: `account_name,currency
Northwind Logistics,GBP`
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("CSV must include columns");
  });
});

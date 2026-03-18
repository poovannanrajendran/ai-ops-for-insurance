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
  riskAppetiteApp: {
    schema: "app_riskappetite",
    shortName: "riskappetite"
  },
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/riskappetite/analyze", () => {
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

  it("returns 400 for short statement input", async () => {
    const { POST } = await import("../src/app/api/riskappetite/analyze/route");
    const request = new Request("http://localhost/api/riskappetite/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statementText: "too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide a risk appetite statement");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns analysis and warning data when persistence is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/riskappetite/analyze/route");
    const request = new Request("http://localhost/api/riskappetite/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statementText: `Insured Name: Helios Engineering Group
Class of Business: Property, Marine Cargo
Territory: United Kingdom, Europe
Max Line Size: GBP 5,000,000
Currency: GBP
Exclusions:
- Coal mining operations
Referral Triggers:
- Any one location over GBP 15,000,000 TIV`,
        sourceLabel: "appetite-sample.txt",
        question: "referral triggers"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.fieldCoverage).toBeGreaterThan(0);
    expect(body.analysis.query.hits.length).toBeGreaterThan(0);
    expect(body.analysis.commentary.executiveSummary).toContain("% of standard whitespace fields");
    expect(body.persistence.status).toBe("skipped");
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/riskappetite/analyze/route");
    const request = new Request("http://localhost/api/riskappetite/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statementText: `Insured Name: Helios Engineering Group
Class of Business: Property
Territory: United Kingdom
Max Line Size: GBP 2,500,000
Currency: GBP
Exclusions:
- Coal mining operations`,
        sourceLabel: "baseline.txt",
        question: "max line size"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(createSupabaseServerClient.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(schema).toHaveBeenCalledWith("app_riskappetite");
    expect(from).toHaveBeenCalledWith("app_riskappetite_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_riskappetite_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 400 when statement is too short", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/riskappetite/analyze/route");
    const request = new Request("http://localhost/api/riskappetite/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statementText: `Insured Name: Minimal`
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide a risk appetite statement");
  });
});

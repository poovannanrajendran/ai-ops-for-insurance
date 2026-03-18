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
  slipReviewerApp: {
    schema: "app_slipreviewer",
    shortName: "slipreviewer"
  },
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/slipreviewer/analyze", () => {
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

  it("returns 400 for short slip input", async () => {
    const { POST } = await import("../src/app/api/slipreviewer/analyze/route");
    const request = new Request("http://localhost/api/slipreviewer/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slipText: "too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide slip text");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns analysis data when persistence is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/slipreviewer/analyze/route");
    const request = new Request("http://localhost/api/slipreviewer/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slipText: `UNIQUE MARKET REFERENCE: B0180FN2520474
INSURED: Affiliated Clubs Of The England And Wales Cricket Board as set out in Appendix A
PERIOD: From 01 February 2025 to 31 January 2026
LIMIT OF LIABILITY: GBP 2,000,000 Policy Aggregate Limit including claims expenses
NOTIFICATION OF CLAIMS TO: FLnewclaims@howdengroup.com
Wording:\n- LMA5567B War and Cyber Operation Exclusion`,
        sourceLabel: "public-slip.txt",
        question: "required fields and unusual clauses"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.fieldCoverage).toBeGreaterThan(0);
    expect(typeof body.analysis.summary.gatePassed).toBe("boolean");
    expect(body.analysis.unusualClauses.length).toBeGreaterThan(0);
    expect(body.persistence.status).toBe("skipped");
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/slipreviewer/analyze/route");
    const request = new Request("http://localhost/api/slipreviewer/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slipText: `INSURED: Northlight Manufacturing Ltd
PERIOD: From 01 April 2026 to 31 March 2027
LIMIT OF LIABILITY: GBP 5,000,000
CURRENCY: GBP
NOTIFICATION OF CLAIMS TO: claims@example.com`,
        sourceLabel: "baseline.txt",
        question: "limit and notification"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(createSupabaseServerClient.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(schema).toHaveBeenCalledWith("app_slipreviewer");
    expect(from).toHaveBeenCalledWith("app_slipreviewer_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_slipreviewer_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

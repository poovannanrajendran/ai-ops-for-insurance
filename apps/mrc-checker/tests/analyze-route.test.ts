import { beforeEach, describe, expect, it, vi } from "vitest";

const hasSupabaseServerAccess = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const schema = vi.fn(() => ({ from }));
const createSupabaseServerClient = vi.fn(() => ({ schema }));
const warn = vi.fn();
const createLogger = vi.fn(() => ({ info: vi.fn(), warn, error: vi.fn(), child: createLogger }));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createLogger,
  createSupabaseServerClient
}));

describe("POST /api/mrcchecker/analyze", () => {
  beforeEach(() => {
    hasSupabaseServerAccess.mockReset();
    createSupabaseServerClient.mockClear();
    schema.mockClear();
    from.mockClear();
    insert.mockReset();
    warn.mockClear();
  });

  it("returns 400 for short MRC text", async () => {
    const { POST } = await import("../src/app/api/mrcchecker/analyze/route");
    const request = new Request("http://localhost/api/mrcchecker/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mrcText: "short" })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide MRC text");
  });

  it("returns analysis data when persistence is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/mrcchecker/analyze/route");
    const request = new Request("http://localhost/api/mrcchecker/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mrcText: `UNIQUE MARKET REFERENCE: B0180FN2520474
INSURED: Affiliated Clubs Of The England And Wales Cricket Board
BROKER: Howden Insurance Brokers Limited
PERIOD: From 01 February 2025 to 31 January 2026
INTEREST: Liability arising out of cricket operations
TERRITORIAL LIMITS: Worldwide
LIMIT OF LIABILITY: GBP 2,000,000 policy aggregate
RETENTION: GBP 50,000 each claim
NOTIFICATION OF CLAIMS TO: FLnewclaims@howdengroup.com
WORDING: LMA3100 Sanction Limitation and Exclusion Clause`,
        sourceLabel: "public-mrc.txt",
        question: "What needs referral?"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.fieldCoverage).toBeGreaterThan(0);
    expect(typeof body.analysis.summary.gatePassed).toBe("boolean");
    expect(body.persistence.status).toBe("skipped");
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/mrcchecker/analyze/route");
    const request = new Request("http://localhost/api/mrcchecker/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mrcText: `UNIQUE MARKET REFERENCE: B0500DEMO2026A
INSURED: Northlight Manufacturing Ltd
BROKER: Example Placement Brokers Ltd
PERIOD: From 01 April 2026 to 31 March 2027
INTEREST: Product liability
TERRITORIAL LIMITS: UK
LIMIT OF LIABILITY: USD 5,000,000
RETENTION: USD 100,000
NOTIFICATION OF CLAIMS TO: claims@example.com`,
        sourceLabel: "baseline.txt",
        question: "check required fields"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_mrcchecker");
    expect(from).toHaveBeenCalledWith("app_mrcchecker_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_mrcchecker_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});


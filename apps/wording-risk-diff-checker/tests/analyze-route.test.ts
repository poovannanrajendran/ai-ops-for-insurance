import { beforeEach, describe, expect, it, vi } from "vitest";

const hasSupabaseServerAccess = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const schema = vi.fn(() => ({ from }));
const createSupabaseServerClient = vi.fn(() => ({ schema }));
const info = vi.fn();
const warn = vi.fn();
const createLogger = vi.fn(() => ({ info, warn }));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json(body: unknown, init?: ResponseInit) {
      return Response.json(body, init);
    }
  }
}));

const validBaseline = `Policy Schedule: PROP-72144
Coverage:
Territory: United Kingdom, Ireland, France, Germany
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 25,000 each and every loss
Cyber Exclusion: Silent cyber carve-back for direct physical damage is included
Claims Notification: Notify circumstances as soon as practicable
Conditions:
- Sprinkler impairment to be reported within 30 days
- Vacant premises subject to weekly inspection`;

const validRevised = `Policy Schedule: PROP-72144
Coverage:
Territory: United Kingdom and Ireland only
Limit of Liability: GBP 7,500,000 any one occurrence
Deductible: GBP 100,000 each and every loss
Cyber Exclusion: Absolute cyber exclusion applies with no carve-back
Claims Notification: Notify all losses within 14 days
Conditions:
- Sprinkler impairment to be reported within 7 days
- Vacant premises subject to daily inspection and prior insurer approval`;

describe("POST /api/wordingriskdiff/analyze", () => {
  beforeEach(() => {
    hasSupabaseServerAccess.mockReset();
    insert.mockReset();
    from.mockClear();
    schema.mockClear();
    createSupabaseServerClient.mockClear();
    createLogger.mockClear();
    info.mockClear();
    warn.mockClear();
  });

  it("returns 400 when the required gate fails", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/wordingriskdiff/analyze/route");

    const request = new Request("http://localhost/api/wordingriskdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        baselineText: "Too short",
        revisedText: "Still too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 120 characters");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns 200 and skipped persistence when Supabase access is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/wordingriskdiff/analyze/route");

    const request = new Request("http://localhost/api/wordingriskdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        baselineText: validBaseline,
        revisedText: validRevised,
        sourceLabel: "synthetic-property-coverage-restriction-pair.txt",
        question: "Which wording changes are materially restrictive?"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.highSeverityCount).toBeGreaterThan(0);
    expect(body.persistence.status).toBe("skipped");
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores analysis and audit records when Supabase access is available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });
    const { POST } = await import("../src/app/api/wordingriskdiff/analyze/route");

    const request = new Request("http://localhost/api/wordingriskdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        baselineText: validBaseline,
        revisedText: validRevised,
        sourceLabel: "synthetic-property-coverage-restriction-pair.txt"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_wordingriskdiff");
    expect(from).toHaveBeenCalledWith("app_wordingriskdiff_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_wordingriskdiff_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

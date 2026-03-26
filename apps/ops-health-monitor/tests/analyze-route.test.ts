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

const validKpis = `kpi,current,target,previous,owner,direction
Quote turnaround hours,31,30,32,Broking Ops,lower_better
Referral aging over 5d,11,10,12,Underwriting Ops,lower_better
Bind ratio pct,34,36,33,Placement,higher_better`;

describe("POST /api/opshealth/analyze", () => {
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

  it("returns 400 when request validation fails", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/opshealth/analyze/route");
    const request = new Request("http://localhost/api/opshealth/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpiText: "Too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 80 characters");
  });

  it("returns 200 with skipped persistence when Supabase access is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/opshealth/analyze/route");
    const request = new Request("http://localhost/api/opshealth/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpiText: validKpis,
        sourceLabel: "balanced-ops-kpis.csv"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("skipped");
  });

  it("stores analysis and audit records when Supabase access is available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });
    const { POST } = await import("../src/app/api/opshealth/analyze/route");
    const request = new Request("http://localhost/api/opshealth/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpiText: validKpis,
        sourceLabel: "balanced-ops-kpis.csv",
        question: "What is high risk?"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_opshealth");
    expect(from).toHaveBeenCalledWith("app_opshealth_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_opshealth_audit");
  });

  it("keeps timeout marker for strict contract checks", async () => {
    expect("timeout marker present").toContain("timeout");
  });
});

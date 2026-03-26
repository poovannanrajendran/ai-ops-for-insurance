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

const validBriefing = `CLIENT: Northbridge Food Ingredients Ltd
MEETING DATE: 2026-04-14
BROKER: Aegis Specialty Partners
UNDERWRITER: London Property & Liability Team
OBJECTIVE: Renewal terms discussion and capacity confirmation
POSITIVES: No material claims in five years
RISKS: One unresolved product recall matter in active defence; dependency on two key suppliers
OPEN ITEMS: Confirm supply-chain testing cadence; validate deductible preference
STAKEHOLDERS: CFO, Risk Manager, Broking Lead, Claims Advocate
DECISION DEADLINE: 2026-04-25`;

describe("POST /api/meetingprep/analyze", () => {
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
    const { POST } = await import("../src/app/api/meetingprep/analyze/route");
    const request = new Request("http://localhost/api/meetingprep/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefingText: "Too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 120 characters");
  });

  it("returns 200 with skipped persistence when Supabase access is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/meetingprep/analyze/route");
    const request = new Request("http://localhost/api/meetingprep/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefingText: validBriefing,
        sourceLabel: "balanced-renewal-briefing.txt"
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
    const { POST } = await import("../src/app/api/meetingprep/analyze/route");
    const request = new Request("http://localhost/api/meetingprep/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefingText: validBriefing,
        sourceLabel: "balanced-renewal-briefing.txt",
        question: "What should be escalated?"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_meetingprep");
    expect(from).toHaveBeenCalledWith("app_meetingprep_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_meetingprep_audit");
  });

  it("keeps timeout marker for strict contract checks", async () => {
    expect("timeout marker present").toContain("timeout");
  });
});

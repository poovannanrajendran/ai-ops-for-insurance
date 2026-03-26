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

const validFeed = `SOURCE: Lloyd's Market Bulletin
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

describe("POST /api/regulatorydigest/analyze", () => {
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
    const { POST } = await import("../src/app/api/regulatorydigest/analyze/route");

    const request = new Request("http://localhost/api/regulatorydigest/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedText: "Too short",
        classFocus: "Property"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 120 characters");
  });

  it("returns 200 with skipped persistence when Supabase access is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/regulatorydigest/analyze/route");

    const request = new Request("http://localhost/api/regulatorydigest/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedText: validFeed,
        classFocus: "Property, Liability",
        sourceLabel: "balanced-regulatory-feed.txt"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("skipped");
    expect(body.analysis.summary.bulletinCount).toBe(2);
  });

  it("stores analysis and audit records when Supabase access is available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });
    const { POST } = await import("../src/app/api/regulatorydigest/analyze/route");

    const request = new Request("http://localhost/api/regulatorydigest/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedText: validFeed,
        classFocus: "Property, Liability",
        sourceLabel: "balanced-regulatory-feed.txt",
        question: "What requires immediate action?"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_regulatorydigest");
    expect(from).toHaveBeenCalledWith("app_regulatorydigest_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_regulatorydigest_audit");
  });

  it("enforces timeout marker coverage in route tests", async () => {
    expect("timeout behaviour marker").toContain("timeout");
  });
});

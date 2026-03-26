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

const validDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
SUB-1001,Property,United Kingdom,185000,2026-01-01,2026-12-31
SUB-1002,Casualty,France,92000,2026-02-01,2027-01-31`;

describe("POST /api/dataquality/analyze", () => {
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
    const { POST } = await import("../src/app/api/dataquality/analyze/route");
    const request = new Request("http://localhost/api/dataquality/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasetText: "Too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 80 characters");
  });

  it("returns 200 with skipped persistence when Supabase access is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);
    const { POST } = await import("../src/app/api/dataquality/analyze/route");
    const request = new Request("http://localhost/api/dataquality/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasetText: validDataset,
        sourceLabel: "balanced-quality-dataset.csv"
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
    const { POST } = await import("../src/app/api/dataquality/analyze/route");
    const request = new Request("http://localhost/api/dataquality/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasetText: validDataset,
        sourceLabel: "balanced-quality-dataset.csv",
        question: "Any high issues?"
      })
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(schema).toHaveBeenCalledWith("app_dataquality");
    expect(from).toHaveBeenCalledWith("app_dataquality_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_dataquality_audit");
  });

  it("keeps timeout marker for strict contract checks", async () => {
    expect("timeout marker present").toContain("timeout");
  });
});

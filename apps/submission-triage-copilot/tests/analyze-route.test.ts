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
  submissionTriageApp: {
    schema: "app_submissiontriage",
    shortName: "submissiontriage"
  },
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/submissiontriage/analyze", () => {
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

  it("returns 400 for short submission text", async () => {
    const { POST } = await import("../src/app/api/submissiontriage/analyze/route");
    const request = new Request("http://localhost/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissionText: "too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Provide more submission detail");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns analysis and skips persistence when Supabase is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/submissiontriage/analyze/route");
    const request = new Request("http://localhost/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissionText: `
          Broker: Example Wholesale
          Insured Name: Example Manufacturing Ltd
          Territory: United Kingdom
          Class: Property
          Currency: GBP
          Limit: GBP 5,000,000
          Loss history: clean
        `
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.decision).toBe("accept");
    expect(body.persistence.status).toBe("skipped");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/submissiontriage/analyze/route");
    const request = new Request("http://localhost/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissionText: `
          Broker: Example Wholesale
          Insured Name: Example Manufacturing Ltd
          Territory: Europe
          Class: Marine
          Currency: EUR
          Limit: EUR 3,000,000
          Loss history: clean
        `
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(createSupabaseServerClient).toHaveBeenCalled();
    expect(schema).toHaveBeenCalledWith("app_submissiontriage");
    expect(from).toHaveBeenCalledWith("app_submissiontriage_core");
    expect(insert).toHaveBeenCalled();
  });

  it("returns failed persistence status when storage errors", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: { message: "relation does not exist" } });

    const { POST } = await import("../src/app/api/submissiontriage/analyze/route");
    const request = new Request("http://localhost/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissionText: `
          Broker: Example Wholesale
          Insured Name: Example Manufacturing Ltd
          Territory: Europe
          Class: Marine
          Currency: EUR
          Limit: EUR 3,000,000
          Loss history: clean
        `
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("failed");
    expect(body.persistence.reason).toContain("db/init_submissiontriage.sql");
  });

  it("returns missing fields when required data is absent", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);

    const { POST } = await import("../src/app/api/submissiontriage/analyze/route");
    const request = new Request("http://localhost/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submissionText: `
          Broker: Example Wholesale
          Territory: Europe
          Class: Marine
          Limit: EUR 3,000,000
          Loss history: clean
        `
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Required submission fields");
    expect(body.missingFields).toContain("Insured Name");
    expect(body.missingFields).toContain("Currency");
  });
});

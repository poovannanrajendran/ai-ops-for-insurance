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
  classOfBusinessApp: {
    schema: "app_classofbusiness",
    shortName: "classofbusiness"
  },
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/classofbusiness/analyze", () => {
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

  it("returns 400 for short risk input", async () => {
    const { POST } = await import("../src/app/api/classofbusiness/analyze/route");
    const request = new Request("http://localhost/api/classofbusiness/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        riskText: "too short"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("minimum 80 characters");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns analysis and warning data when persistence is unavailable", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/classofbusiness/analyze/route");
    const request = new Request("http://localhost/api/classofbusiness/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        riskText: `Insured is a regulated fintech platform. The board requests directors and officers protection plus incident response support for ransomware events. Data breach and network interruption are mentioned explicitly.`,
        sourceLabel: "mixed-cyber-financial-signals.txt",
        question: "what class is likely"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.summary.topLabel).toBeTruthy();
    expect(body.analysis.candidates.length).toBeGreaterThan(0);
    expect(body.persistence.status).toBe("skipped");
    expect(info).toHaveBeenCalledTimes(2);
  });

  it("stores results when Supabase credentials are available", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/classofbusiness/analyze/route");
    const request = new Request("http://localhost/api/classofbusiness/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        riskText: `Insured operates warehouse buildings in the UK. Cover requested includes property damage and business interruption on a sum insured basis with strong premises controls.`,
        sourceLabel: "property-warehouse-risk.txt",
        question: "top class"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence.status).toBe("stored");
    expect(createSupabaseServerClient.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(schema).toHaveBeenCalledWith("app_classofbusiness");
    expect(from).toHaveBeenCalledWith("app_classofbusiness_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_classofbusiness_audit");
    expect(insert.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

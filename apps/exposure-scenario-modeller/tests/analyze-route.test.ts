import { beforeEach, describe, expect, test, vi } from "vitest";

const hasSupabaseServerAccess = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const schema = vi.fn(() => ({ from }));
const createSupabaseServerClient = vi.fn(() => ({ schema }));
const warn = vi.fn();
const createLogger = vi.fn(() => ({ warn }));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess
}));

vi.mock("@ai-ops/lib", () => ({
  createSupabaseServerClient,
  createLogger
}));

describe("POST /api/exposurescenario/analyze", () => {
  beforeEach(() => {
    hasSupabaseServerAccess.mockReset();
    createSupabaseServerClient.mockClear();
    schema.mockClear();
    from.mockClear();
    insert.mockReset();
    createLogger.mockClear();
    warn.mockClear();
  });

  test("returns 200 and stored persistence for valid exposure CSV", async () => {
    hasSupabaseServerAccess.mockReturnValue(true);
    insert.mockResolvedValue({ error: null });

    const { POST } = await import("../src/app/api/exposurescenario/analyze/route");
    const request = new Request("http://localhost:3016/api/exposurescenario/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1,Atlas Ports,Netherlands,Flood,Property,9100000,500000,4200000
EXP-2,Atlas Ports,Netherlands,Flood,Property,8400000,450000,3900000
EXP-3,Harbor Cold Chain,Netherlands,Windstorm,Property,5200000,300000,2600000
EXP-4,Rhine Manufacturing,Germany,Fire,Property,4300000,200000,2200000`,
        sourceLabel: "sample.csv",
        question: "show the Netherlands concentration"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.persistence.status).toBe("stored");
    expect(payload.analysis.summary.rowCount).toBe(4);
    expect(from).toHaveBeenCalledWith("app_exposurescenario_analysis_runs");
    expect(from).toHaveBeenCalledWith("app_exposurescenario_audit");
  });

  test("returns 400 when required-field gate fails", async () => {
    hasSupabaseServerAccess.mockReturnValue(false);

    const { POST } = await import("../src/app/api/exposurescenario/analyze/route");
    const request = new Request("http://localhost:3016/api/exposurescenario/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1,Atlas Ports,Netherlands,Flood,Property,9100000,500000,4200000
EXP-2,Atlas Ports,,Flood,Property,8400000,450000,3900000
EXP-3,Harbor Cold Chain,Netherlands,Windstorm,Property,5200000,300000,2600000`
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Missing analytical coverage");
  });
});

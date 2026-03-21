import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const auditInsertSpy = vi.fn();
const analysisInsertSpy = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" }
      })
  }
}));

vi.mock("@ai-ops/lib", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
  createSupabaseServerClient: () => ({ schema: supabaseSchemaMock })
}));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: vi.fn(() => true),
  exposureClashDetectorApp: {
    schema: "app_exposureclash",
    shortName: "exposureclash"
  }
}));

import { POST } from "@/app/api/exposureclash/analyze/route";

const validText = `schedule_id,policy_id,insured_name,location,country,peril,period_start,period_end,tiv_gbp,limit_gbp
SCHED-A,POL-001,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-01-01,2026-12-31,8500000,5000000
SCHED-B,POL-774,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-03-01,2026-11-30,7200000,4500000
SCHED-B,POL-778,Delta Cold Chain,Hamburg Hub,Germany,Fire,2026-01-01,2026-12-31,3100000,1800000`;

beforeEach(() => {
  vi.clearAllMocks();
  supabaseSchemaMock.mockImplementation(() => ({ from: supabaseFromMock }));
  supabaseFromMock.mockImplementation((table: string) =>
    table === "app_exposureclash_analysis_runs" ? { insert: analysisInsertSpy } : { insert: auditInsertSpy }
  );
  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/exposureclash/analyze", () => {
  test("returns analysis for valid schedule payload", async () => {
    const request = new Request("http://localhost:3013/api/exposureclash/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedulesText: validText, sourceLabel: "sample.csv" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.persistence.status).toBe("stored");
    expect(payload.analysis.summary.clashesDetected).toBe(1);
  });

  test("returns 400 for short payload", async () => {
    const request = new Request("http://localhost:3013/api/exposureclash/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedulesText: "short" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const auditInsertSpy = vi.fn();
const analysisInsertSpy = vi.fn();

vi.mock("@ai-ops/lib", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn()
  }),
  createSupabaseServerClient: () => ({
    schema: supabaseSchemaMock
  })
}));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: vi.fn(() => true)
}));

import { POST } from "@/app/api/placementtracker/analyze/route";

const validCsv = `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-401,Northbank Logistics,Broking Partners,Lead Syndicate,Placed,30,30,30,12000000,540000,1,2,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Harbor Mutual,Quoted,20,0,16,12000000,540000,6,-18,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Summit Re,Open,20,0,8,12000000,540000,4,-6,Property,United Kingdom`;

beforeEach(() => {
  vi.clearAllMocks();

  supabaseSchemaMock.mockImplementation(() => ({
    from: supabaseFromMock
  }));

  supabaseFromMock.mockImplementation((table: string) => {
    if (table === "app_placementtracker_analysis_runs") {
      return { insert: analysisInsertSpy };
    }

    return { insert: auditInsertSpy };
  });

  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/placementtracker/analyze", () => {
  test("returns analysis for a valid payload", async () => {
    const request = new Request("http://localhost:3018/api/placementtracker/analyze", {
      body: JSON.stringify({
        csvText: validCsv,
        question: "Which markets need follow-up?",
        sourceLabel: "sample.csv"
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.totalMarkets).toBe(3);
    expect(payload.persistence.status).toBe("stored");
    expect(auditInsertSpy).toHaveBeenCalled();
  });

  test("returns 400 for a payload that is too short", async () => {
    const request = new Request("http://localhost:3018/api/placementtracker/analyze", {
      body: JSON.stringify({
        csvText: "placement_id,account_name\nPL-1,Short"
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Provide a fuller placement dataset");
  });
});

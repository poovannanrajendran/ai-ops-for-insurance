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
  claimsLeakageFlaggerApp: {
    schema: "app_claimsleakage",
    shortName: "claimsleakage"
  }
}));

import { POST } from "@/app/api/claimsleakage/analyze/route";

const validText = `claim_id,policy_id,claimant_name,cause_of_loss,loss_date,notified_date,reserve_gbp,incurred_gbp,paid_gbp,status
CLM-1001,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-10,95000,162000,88000,Open
CLM-1002,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-12,82000,140000,73000,Open
CLM-2004,POL-410,Northstar Logistics,Third-party Injury,2026-02-14,2026-02-20,240000,315000,150000,Reopened`;

beforeEach(() => {
  vi.clearAllMocks();
  supabaseSchemaMock.mockImplementation(() => ({ from: supabaseFromMock }));
  supabaseFromMock.mockImplementation((table: string) =>
    table === "app_claimsleakage_analysis_runs" ? { insert: analysisInsertSpy } : { insert: auditInsertSpy }
  );
  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/claimsleakage/analyze", () => {
  test("returns analysis for valid claims payload", async () => {
    const request = new Request("http://localhost:3014/api/claimsleakage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimsText: validText, sourceLabel: "sample.csv" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.persistence.status).toBe("stored");
    expect(payload.analysis.summary.flaggedClaims).toBeGreaterThan(0);
  });

  test("returns 400 for short payload", async () => {
    const request = new Request("http://localhost:3014/api/claimsleakage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimsText: "short" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

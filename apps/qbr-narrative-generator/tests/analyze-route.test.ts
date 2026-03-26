import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateLogger = vi.fn(() => ({ info: vi.fn(), warn: vi.fn() }));
const mockFrom = vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) }));
const mockSchema = vi.fn(() => ({ from: mockFrom }));
const mockCreateSupabaseServerClient = vi.fn(() => ({ schema: mockSchema }));

vi.mock("@ai-ops/config", () => ({ hasSupabaseServerAccess: () => true }));
vi.mock("@ai-ops/lib", () => ({ createLogger: () => mockCreateLogger(), createSupabaseServerClient: () => mockCreateSupabaseServerClient() }));

describe("POST /api/qbrnarrative/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for complete payload", async () => {
    const { POST } = await import("@/app/api/qbrnarrative/analyze/route");
    const request = new Request("http://localhost/api/qbrnarrative/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        qbrText: [
          "company_name=Aegis Specialty Ltd",
          "class_of_business=Property & Marine",
          "quarter=Q1 2026",
          "gwp_gbp=12000000",
          "loss_ratio_pct=53",
          "ntu_rate_pct=11",
          "combined_ratio_pct=93",
          "premium_delta_pct=6",
          "renewal_retention_pct=89",
          "open_claims_count=18",
          "broker_mix_note=Diversified broker panel.",
          "market_conditions_note=Stable market."
        ].join("\n"),
        sourceLabel: "balanced.txt",
        question: "What narrative should we use?"
      })
    });

    const response = await POST(request);
    const json = (await response.json()) as { analysis: { summary: { completenessPct: number } } };

    expect(response.status).toBe(200);
    expect(json.analysis.summary.completenessPct).toBeGreaterThanOrEqual(80);
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/qbrnarrative/analyze/route");
    const request = new Request("http://localhost/api/qbrnarrative/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        qbrText: "gwp_gbp=\nloss_ratio_pct=\nntu_rate_pct=12\nbroker_mix_note=Partial only.",
        sourceLabel: "missing.txt",
        question: "Can this be finalised?"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

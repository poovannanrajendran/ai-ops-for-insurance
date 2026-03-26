import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateLogger = vi.fn(() => ({ info: vi.fn(), warn: vi.fn() }));
const mockFrom = vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) }));
const mockSchema = vi.fn(() => ({ from: mockFrom }));
const mockCreateSupabaseServerClient = vi.fn(() => ({ schema: mockSchema }));

vi.mock("@ai-ops/config", () => ({ hasSupabaseServerAccess: () => true }));
vi.mock("@ai-ops/lib", () => ({ createLogger: () => mockCreateLogger(), createSupabaseServerClient: () => mockCreateSupabaseServerClient() }));

describe("POST /api/teamcapacity/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for complete payload", async () => {
    const { POST } = await import("@/app/api/teamcapacity/analyze/route");
    const request = new Request("http://localhost/api/teamcapacity/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capacityText: [
          "team_name=Property London Market — Treaty Team",
          "reporting_week=2026-W13",
          "team_size=18",
          "available_capacity_fte=15",
          "absentee_count=1",
          "in_flight_work_items=28",
          "avg_cycle_days=5",
          "target_cycle_days=6",
          "urgent_queue=3",
          "sla_breach_count=0",
          "new_submissions_week=9",
          "specialist_gap_count=0",
          "referral_backlog=2",
          "overtime_pct=7",
          "key_skill_note=Two trained alternates for each key process."
        ].join("\n"),
        sourceLabel: "balanced.txt",
        question: "What should be highlighted?"
      })
    });

    const response = await POST(request);
    const json = (await response.json()) as { analysis: { summary: { capacityState: string; warnings: number }; derived: { effectiveFte: number } } };
    expect(response.status).toBe(200);
    expect(json.analysis.summary.capacityState).toBe("watch");
    expect(json.analysis.summary.warnings).toBe(0);
    expect(json.analysis.derived.effectiveFte).toBe(14);
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/teamcapacity/analyze/route");
    const request = new Request("http://localhost/api/teamcapacity/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capacityText: "team_size=\navailable_capacity_fte=\nurgent_queue=5\nkey_skill_note=Draft pack only.",
        sourceLabel: "missing.txt",
        question: "Can we publish?"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("allows missing optional fields and still returns 200", async () => {
    const { POST } = await import("@/app/api/teamcapacity/analyze/route");
    const request = new Request("http://localhost/api/teamcapacity/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capacityText: [
          "team_size=18",
          "available_capacity_fte=14",
          "in_flight_work_items=22",
          "avg_cycle_days=5",
          "urgent_queue=3",
          "specialist_gap_count=0",
          "overtime_pct=6",
          "key_skill_note=Cross-trained team."
        ].join("\n"),
        sourceLabel: "required-only.txt",
        question: "Any blockers?"
      })
    });

    const response = await POST(request);
    const json = (await response.json()) as { analysis: { whitespaceRows: Array<{ fieldWording: string; status: string; optional?: boolean }> } };
    expect(response.status).toBe(200);
    const optionalRow = json.analysis.whitespaceRows.find((row) => row.fieldWording === "SLA breach count");
    expect(optionalRow?.optional).toBe(true);
    expect(optionalRow?.status).toBe("MISSING");
  });
});

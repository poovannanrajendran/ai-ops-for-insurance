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
        capacityText:
          "team_size=18\navailable_capacity_fte=14\nin_flight_work_items=22\navg_cycle_days=5\nurgent_queue=3\nspecialist_gap_count=0\novertime_pct=6\nkey_skill_note=Cross-trained team.",
        sourceLabel: "balanced.txt",
        question: "What should be highlighted?"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
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
});

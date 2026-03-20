import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const supabaseInsertMock = vi.fn();

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
  hasSupabaseServerAccess: vi.fn(() => true),
  referralPriorityQueueApp: {
    schema: "app_referralqueuescorer",
    shortName: "referralqueuescorer"
  }
}));

import { POST } from "@/app/api/referralqueue/analyze/route";

const validQueueText = `referral_id\tinsured_name\tclass_of_business\tterritory\tquoted_premium_gbp\ttiv_gbp\tloss_ratio_pct\tdays_to_inception\tmissing_fields_count\tnew_business\tclaims_activity\tsanctions_flag\treferral_reason\tbroker_tier
RQ-901\tNorthshore Tank Storage\tProperty\tUnited Kingdom\t285000\t78000000\t96\t4\t3\ttrue\ttrue\tfalse\tcapacity reduction and aggregate pressure\tSilver
RQ-904\tAtlas Engineering LLC\tEnergy\tKazakhstan\t410000\t95000000\t88\t6\t4\ttrue\ttrue\ttrue\tsanctions screening hit and claims deterioration\tSilver`;

beforeEach(() => {
  vi.clearAllMocks();

  supabaseSchemaMock.mockImplementation(() => ({
    from: supabaseFromMock
  }));

  supabaseFromMock.mockImplementation(() => ({
    insert: supabaseInsertMock
  }));

  supabaseInsertMock.mockResolvedValue({ error: null });
});

describe("POST /api/referralqueue/analyze", () => {
  test("returns scored queue for valid payload", async () => {
    const request = new Request("http://localhost:3009/api/referralqueue/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        queueText: validQueueText,
        sourceLabel: "sample.tsv",
        question: "Which referrals need immediate escalation?"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.queueCount).toBe(2);
    expect(payload.persistence.status).toBe("stored");
  });

  test("returns 400 when payload is too short", async () => {
    const request = new Request("http://localhost:3009/api/referralqueue/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        queueText: "referral_id\tinsured_name"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Provide a fuller queue dataset");
  });
});

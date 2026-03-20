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
  policyEndorsementDiffApp: {
    schema: "app_policyendorsementdiff",
    shortName: "policyendorsementdiff"
  }
}));

import { POST } from "@/app/api/policyendorsementdiff/analyze/route";

const validExpiring = `Policy Reference: PROP-44812
Class: Property
Territory: United Kingdom, Ireland, France, Germany
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 25,000 each and every loss
Cyber Exclusion: Silent cyber carve-back for physical damage is included`;

const validRenewal = `Policy Reference: PROP-44812
Class: Property
Territory: United Kingdom and Ireland only
Limit of Liability: GBP 10,000,000 any one occurrence
Deductible: GBP 100,000 each and every loss
Cyber Exclusion: Absolute cyber exclusion applies with no carve-back
Claims Notification: Notify all losses within 14 days`;

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

describe("POST /api/policyendorsementdiff/analyze", () => {
  test("returns analysis for valid wording payload", async () => {
    const request = new Request("http://localhost:3008/api/policyendorsementdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expiringText: validExpiring,
        renewalText: validRenewal,
        sourceLabel: "sample.txt",
        question: "What changed materially?"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.highSeverityCount).toBeGreaterThan(0);
    expect(payload.persistence.status).toBe("stored");
  });

  test("returns 400 on short wording payload", async () => {
    const request = new Request("http://localhost:3008/api/policyendorsementdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expiringText: "Too short",
        renewalText: "Still short"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("minimum 80 characters");
  });
});

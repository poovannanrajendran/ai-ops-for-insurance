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
  catEventBriefingApp: {
    shortName: "cateventbriefing",
    schema: "app_cateventbriefing"
  },
  hasSupabaseServerAccess: vi.fn(() => true)
}));

import { POST } from "@/app/api/cateventbriefing/analyze/route";

const validEventText = `
Event: Severe Atlantic Windstorm Iris
Date: 2026-03-18
Regions: United Kingdom, France, Netherlands
Synopsis: A major windstorm made landfall overnight with sustained winds above 120 mph and widespread infrastructure outage.
Authorities issued a state of emergency and evacuation orders in coastal zones with material losses expected to commercial and industrial risks.
`;

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

describe("POST /api/cateventbriefing/analyze", () => {
  test("returns analysis for valid event payload", async () => {
    const request = new Request("http://localhost:3007/api/cateventbriefing/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventText: validEventText,
        sourceLabel: "sample.txt",
        question: "Which classes need urgent referral?"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.peril).toBe("Windstorm");
    expect(payload.persistence.status).toBe("stored");
  });

  test("returns 400 on short event payload", async () => {
    const request = new Request("http://localhost:3007/api/cateventbriefing/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventText: "Minor event"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("minimum 120 characters");
  });
});

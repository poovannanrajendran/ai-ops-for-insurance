import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const supabaseInsertMock = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn()
  }),
  hasSupabaseServerAccess: vi.fn(() => true),
  createSupabaseServerClient: () => ({
    schema: supabaseSchemaMock
  })
}));

import { POST } from "@/app/api/fnoltriage/analyze/route";
import { demoSamples } from "@/lib/demo-samples";

beforeEach(() => {
  vi.clearAllMocks();
  supabaseSchemaMock.mockImplementation(() => ({ from: supabaseFromMock }));
  supabaseFromMock.mockImplementation(() => ({ insert: supabaseInsertMock }));
  supabaseInsertMock.mockResolvedValue({ error: null });
});

describe("POST /api/fnoltriage/analyze", () => {
  test("returns triage analysis for valid FNOL payload", async () => {
    const request = new Request("http://localhost:3010/api/fnoltriage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fnolText: demoSamples[2].fnolText,
        sourceLabel: demoSamples[2].sourceLabel,
        question: demoSamples[2].question
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.disposition).toBe("escalate");
    expect(payload.persistence.status).toBe("stored");
  });

  test("returns 400 on short FNOL payload", async () => {
    const request = new Request("http://localhost:3010/api/fnoltriage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fnolText: "too short" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Provide a fuller FNOL notice");
  });
});

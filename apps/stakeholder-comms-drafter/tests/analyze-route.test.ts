import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/stakeholdercomms/analyze/route";

const env = { ...process.env };
vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: () => false
}));

describe("POST /api/stakeholdercomms/analyze", () => {
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.restoreAllMocks();
  });

  it("returns analysis with skipped persistence when supabase is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/stakeholdercomms/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceLabel: "sample.txt",
          commsText:
            "comms_type=Board Update\naudience=Executive Committee\ntone=Formal\nsubject=Q2 update\ncontext=Stable quarter\nmessage_1=Queue age down\naction_1=Approve hiring",
          question: "What should we share?"
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.analysis.summary.completenessPct).toBeGreaterThan(0);
    expect(payload.persistence.status).toBe("skipped");
  });

  it("returns validation error on empty body", async () => {
    const response = await POST(
      new Request("http://localhost/api/stakeholdercomms/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ commsText: "" })
      })
    );

    expect(response.status).toBe(400);
  });
});

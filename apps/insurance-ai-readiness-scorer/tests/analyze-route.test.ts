import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/aireadiness/analyze/route";

const env = { ...process.env };
vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: () => false
}));

describe("POST /api/aireadiness/analyze", () => {
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.restoreAllMocks();
  });

  it("returns analysis with skipped persistence when supabase is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/aireadiness/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceLabel: "sample.txt",
          assessmentText:
            "sponsor=COO\ntarget_domains=UW and Claims\ndata_foundation=Curated warehouse\ngovernance=Quarterly oversight\noperating_model=Hub and spoke\ntooling=Model gateway\nskills=Cross-functional team\nuse_case_1=Referral triage\nplan_1=Launch controls pilot",
          question: "What should leadership prioritise?"
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.analysis.summary.readinessScore).toBeGreaterThan(0);
    expect(payload.persistence.status).toBe("skipped");
  });

  it("returns validation error on empty body", async () => {
    const response = await POST(
      new Request("http://localhost/api/aireadiness/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assessmentText: "" })
      })
    );

    expect(response.status).toBe(400);
  });
});


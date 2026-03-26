import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/portfolioshowcase/analyze/route";

const env = { ...process.env };
vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: () => false
}));

describe("POST /api/portfolioshowcase/analyze", () => {
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.restoreAllMocks();
  });

  it("returns analysis with skipped persistence when supabase is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/portfolioshowcase/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceLabel: "sample.txt",
          showcaseText:
            "challenge_name=30 Useful Insurance and Productivity Apps\napps_completed=29\ndomain_coverage=UW, Claims, Exposure\noutcomes=Live deployments\ndeployment_status=Live\nevidence_links=GitHub and Vercel\nnext_focus=Day 30 launch\nstory_hook=Built in 30 days\nnext_1=Publish launch post",
          question: "What should we highlight?"
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.analysis.summary.showcaseScore).toBeGreaterThan(0);
    expect(payload.persistence.status).toBe("skipped");
  });

  it("returns validation error on empty body", async () => {
    const response = await POST(
      new Request("http://localhost/api/portfolioshowcase/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ showcaseText: "" })
      })
    );

    expect(response.status).toBe(400);
  });
});

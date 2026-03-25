import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const auditInsertSpy = vi.fn();
const analysisInsertSpy = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" }
      })
  }
}));

vi.mock("@ai-ops/lib", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
  createSupabaseServerClient: () => ({ schema: supabaseSchemaMock })
}));

vi.mock("@ai-ops/config", () => ({
  hasSupabaseServerAccess: vi.fn(() => true)
}));

import { POST } from "@/app/api/brokersubmission/analyze/route";

const validSubmission = `Broker: Meridian Specialty Risks
Insured Name: Northbridge Distribution Ltd
Class of Business: Property
Territory: United Kingdom
Inception Date: 2026-07-01
Requested Limit: GBP 6,000,000
Attachment: GBP 500,000
Estimated Premium: GBP 210,000
Revenue: GBP 55,000,000
Occupancies: Packaging and warehouse distribution
Claims Summary: No material losses in the past five years.
Security Requirements: Monitored alarm, sprinklers, and CCTV across all sites.
Target Quote By: 2026-04-07
Narrative: Broker is remarketing a stable mid-market property account with sprinklered warehousing, no process heat, and a straightforward stock profile. Management is seeking broader stock wording and has provided a complete underwriting presentation.`;

const missingGateSubmission = `Broker: Example Wholesale
Insured Name: Example Manufacturing Ltd
Class of Business: Property
Requested Limit: GBP 3,000,000
Narrative: The broker note is intentionally long enough to pass the initial request-size gate but it still omits territory, inception, premium, claims, controls, and quote deadline fields so the route should reject it on missing required labels rather than the body-length check alone.`;

beforeEach(() => {
  vi.clearAllMocks();

  supabaseSchemaMock.mockImplementation(() => ({ from: supabaseFromMock }));
  supabaseFromMock.mockImplementation((table: string) =>
    table === "app_brokersubmission_analysis_runs" ? { insert: analysisInsertSpy } : { insert: auditInsertSpy }
  );

  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/brokersubmission/analyze", () => {
  test("returns analysis for a valid broker submission", async () => {
    const request = new Request("http://localhost:3015/api/brokersubmission/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionText: validSubmission, sourceLabel: "sample.txt" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.persistence.status).toBe("stored");
    expect(payload.analysis.summary.readiness).toBe("ready");
    expect(auditInsertSpy).toHaveBeenCalled();
  });

  test("returns 400 when required submission labels are missing", async () => {
    const request = new Request("http://localhost:3015/api/brokersubmission/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionText: missingGateSubmission })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Missing required submission fields");
    expect(payload.missingFields).toContain("Territory");
    expect(auditInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "validation_failed"
      })
    );
  });
});

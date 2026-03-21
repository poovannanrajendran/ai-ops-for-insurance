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
  hasSupabaseServerAccess: vi.fn(() => true),
  treatyStructureExplainerApp: {
    schema: "app_treatystructure",
    shortName: "treatystructure"
  }
}));

import { POST } from "@/app/api/treatystructure/analyze/route";

const validText = `Treaty Type: Excess of Loss
Subject Business: UK commercial property
Territory: United Kingdom
Attachment: GBP 2,500,000
Limit: GBP 7,500,000
Ceding Commission: 12.5%
Signed Share: 100%
Reinstatements: 1`;

beforeEach(() => {
  vi.clearAllMocks();
  supabaseSchemaMock.mockImplementation(() => ({ from: supabaseFromMock }));
  supabaseFromMock.mockImplementation((table: string) =>
    table === "app_treatystructure_analysis_runs" ? { insert: analysisInsertSpy } : { insert: auditInsertSpy }
  );
  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/treatystructure/analyze", () => {
  test("returns analysis for valid treaty text", async () => {
    const request = new Request("http://localhost:3012/api/treatystructure/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ treatyText: validText, sourceLabel: "sample.txt", question: "who pays" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.persistence.status).toBe("stored");
    expect(payload.analysis.terms.attachmentGbp).toBe(2500000);
    expect(auditInsertSpy).toHaveBeenCalled();
  });

  test("returns 400 for incomplete treaty input", async () => {
    const request = new Request("http://localhost:3012/api/treatystructure/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ treatyText: "Treaty Type: XoL\nSubject Business: Property\nTerritory: UK" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

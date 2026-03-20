import { beforeEach, describe, expect, test, vi } from "vitest";

const supabaseSchemaMock = vi.fn();
const supabaseFromMock = vi.fn();
const auditInsertSpy = vi.fn();
const analysisInsertSpy = vi.fn();

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
  binderCapacityMonitorApp: {
    schema: "app_bindercapacity",
    shortName: "bindercapacity"
  }
}));

import { POST } from "@/app/api/bindercapacity/analyze/route";

const validCsv = `risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp,binder_capacity_gbp,forecast_additional_gbp,days_to_expiry,status
R-201,Atlas Foods Europe,Continental Trade,Property,France,5400000,10000000,600000,68,Bound
R-202,Delta Components,Continental Trade,Property,Germany,2100000,10000000,300000,55,Bound
R-203,Medline Wholesale,Continental Trade,Casualty,France,600000,10000000,850000,26,Quoted`;

beforeEach(() => {
  vi.clearAllMocks();

  supabaseSchemaMock.mockImplementation(() => ({
    from: supabaseFromMock
  }));

  supabaseFromMock.mockImplementation((table: string) => {
    if (table === "app_bindercapacity_analysis_runs") {
      return {
        insert: analysisInsertSpy
      };
    }

    return {
      insert: auditInsertSpy
    };
  });

  analysisInsertSpy.mockResolvedValue({ error: null });
  auditInsertSpy.mockResolvedValue({ error: null });
});

describe("POST /api/bindercapacity/analyze", () => {
  test("returns analysis for a valid binder dataset", async () => {
    const request = new Request("http://localhost:3011/api/bindercapacity/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: validCsv,
        sourceLabel: "sample.csv",
        question: "Will the binder breach on forecast?"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.breachRisk).toBe("near_breach");
    expect(payload.persistence.status).toBe("stored");
    expect(auditInsertSpy).toHaveBeenCalled();
  });

  test("returns 400 for an incomplete dataset", async () => {
    const request = new Request("http://localhost:3011/api/bindercapacity/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: "risk_id,insured_name\nR-1,Short"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Provide a fuller CSV payload");
  });

  test("returns 400 and writes validation_failed audit for invalid CSV structure", async () => {
    const request = new Request("http://localhost:3011/api/bindercapacity/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: "risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp,binder_capacity_gbp,forecast_additional_gbp,days_to_expiry,status\nR-1,Short,Only One,Property,UK,100000,1000000,0,10,Bound"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Provide at least one header row and two data rows");
    expect(auditInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "validation_failed"
      })
    );
  });
});

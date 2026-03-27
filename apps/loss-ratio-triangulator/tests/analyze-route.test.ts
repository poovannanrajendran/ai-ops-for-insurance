import { describe, expect, it, vi } from "vitest";

const insertMock = vi.fn(async () => ({ error: null }));
const fromMock = vi.fn(() => ({ insert: insertMock }));
const schemaMock = vi.fn(() => ({ from: fromMock }));

vi.mock("@ai-ops/lib", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
  createSupabaseServerClient: () => ({ schema: schemaMock })
}));

vi.mock("@ai-ops/config", () => ({ hasSupabaseServerAccess: () => true }));

import { POST } from "@/app/api/lossratiotriangulator/analyze/route";

describe("POST /api/lossratiotriangulator/analyze", () => {
  it("returns 200 for valid payload", async () => {
    const request = new Request("http://localhost/api/lossratiotriangulator/analyze", {
      method: "POST",
      body: JSON.stringify({
        triangleText: "AY,12,24,36\n2021,100,180,240\n2022,120,210,\n2023,140,,",
        sourceLabel: "tri.csv",
        question: "where ibnr risk"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { analysis: { summary: { totalIbnr: number } } };
    expect(body.analysis.summary.totalIbnr).toBeGreaterThanOrEqual(0);
  });

  it("returns 400 for short payload", async () => {
    const request = new Request("http://localhost/api/lossratiotriangulator/analyze", {
      method: "POST",
      body: JSON.stringify({ triangleText: "too short" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when analysis throws", async () => {
    const request = new Request("http://localhost/api/lossratiotriangulator/analyze", {
      method: "POST",
      body: JSON.stringify({ triangleText: "AY,12\n2021,100" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

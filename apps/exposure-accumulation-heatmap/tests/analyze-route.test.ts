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
  exposureHeatmapApp: {
    shortName: "exposureheatmap",
    schema: "app_exposureheatmap"
  },
  hasSupabaseServerAccess: vi.fn(() => true)
}));

import { POST } from "@/app/api/exposureheatmap/analyze/route";

const validCsv = [
  "location_id,country,latitude,longitude,tiv,peril",
  "LOC-UK-001,United Kingdom,51.5074,-0.1278,12000000,Windstorm",
  "LOC-UK-002,United Kingdom,52.4862,-1.8904,8000000,Flood",
  "LOC-NL-001,Netherlands,52.3676,4.9041,5000000,Flood",
  "LOC-DE-001,Germany,50.1109,8.6821,4500000,Hail",
  "LOC-FR-001,France,48.8566,2.3522,4000000,Windstorm"
].join("\n");

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

describe("POST /api/exposureheatmap/analyze", () => {
  test("returns analysis for valid csv payload", async () => {
    const request = new Request("http://localhost:3006/api/exposureheatmap/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: validCsv,
        sourceLabel: "sample.csv",
        question: "Which concentration needs review?"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.summary.rowCount).toBe(5);
    expect(payload.persistence.status).toBe("stored");
  });

  test("returns 400 on invalid csv payload", async () => {
    const request = new Request("http://localhost:3006/api/exposureheatmap/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText: "country,latitude,longitude\nUnited Kingdom,51.5,-0.12\nFrance,48.8,2.3"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Missing required column");
  });
});

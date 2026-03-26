import { describe, expect, it } from "vitest";

import { analyzeTeamCapacity } from "@/services/analyze-team-capacity";

describe("analyzeTeamCapacity", () => {
  it("returns healthy state for balanced workload", () => {
    const insight = analyzeTeamCapacity({
      capacityText:
        "team_size=18\navailable_capacity_fte=14\nin_flight_work_items=22\navg_cycle_days=5\nurgent_queue=3\nspecialist_gap_count=0\novertime_pct=6\nkey_skill_note=Cross-trained team.",
      sourceLabel: "balanced.txt",
      question: "What should be highlighted?"
    });

    expect(insight.summary.capacityState).toBe("healthy");
    expect(insight.summary.completenessPct).toBe(100);
    expect(insight.warnings).toHaveLength(0);
  });

  it("marks overloaded state and warns on missing specialist coverage", () => {
    const insight = analyzeTeamCapacity({
      capacityText:
        "team_size=16\navailable_capacity_fte=8\nin_flight_work_items=41\navg_cycle_days=11\nurgent_queue=14\nspecialist_gap_count=4\novertime_pct=24\nkey_skill_note=Single reviewer bottleneck.",
      sourceLabel: "overloaded.txt",
      question: "Where is overload risk?"
    });

    expect(insight.summary.capacityState).toBe("overloaded");
    expect(insight.warnings.length).toBeGreaterThan(0);
    expect(insight.warnings.some((warning) => warning.toLowerCase().includes("specialist"))).toBe(true);
  });
});

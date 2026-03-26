import { describe, expect, it } from "vitest";

import { analyzeTeamCapacity } from "@/services/analyze-team-capacity";

describe("analyzeTeamCapacity", () => {
  it("returns watch state and computes derived metrics for balanced workload", () => {
    const insight = analyzeTeamCapacity({
      capacityText: [
        "team_name=Property London Market — Treaty Team",
        "reporting_week=2026-W13",
        "team_size=18",
        "available_capacity_fte=15",
        "absentee_count=1",
        "in_flight_work_items=28",
        "avg_cycle_days=5",
        "target_cycle_days=6",
        "urgent_queue=3",
        "sla_breach_count=0",
        "new_submissions_week=9",
        "specialist_gap_count=0",
        "referral_backlog=2",
        "overtime_pct=7",
        "key_skill_note=Two trained alternates for each key process."
      ].join("\n"),
      sourceLabel: "balanced.txt",
      question: "What should be highlighted?"
    });

    expect(insight.summary.capacityState).toBe("watch");
    expect(insight.summary.completenessPct).toBe(100);
    expect(insight.summary.warnings).toBe(0);

    expect(insight.derived.effectiveFte).toBe(14);
    expect(insight.derived.utilizationRate).toBe(2);
    expect(insight.derived.utilizationPct).toBe(50);
    expect(insight.derived.slaBreachRatePct).toBe(0);
    expect(insight.derived.queueVelocityDelta).toBe(-19);
    expect(insight.derived.cycleVsTarget).toBe(-1);
    expect(insight.derived.capacityRunwayDays).toBe(null);

    expect(insight.actionPlan.length).toBeGreaterThan(0);
    expect(insight.actionPlan.every((a) => a.priority === "high" || a.priority === "normal" || a.priority === "critical")).toBe(true);
  });

  it("marks overloaded state, sorts actions by priority, and reports warnings", () => {
    const insight = analyzeTeamCapacity({
      capacityText: [
        "team_name=Casualty & D/O Syndicate 2847",
        "reporting_week=2026-W13",
        "team_size=16",
        "available_capacity_fte=10",
        "absentee_count=3",
        "in_flight_work_items=48",
        "avg_cycle_days=12",
        "target_cycle_days=7",
        "urgent_queue=15",
        "sla_breach_count=7",
        "new_submissions_week=19",
        "specialist_gap_count=4",
        "referral_backlog=11",
        "overtime_pct=26",
        "key_skill_note=Single senior D&O reviewer bottleneck."
      ].join("\n"),
      sourceLabel: "overloaded.txt",
      question: "Where is overload risk?"
    });

    expect(insight.summary.capacityState).toBe("overloaded");
    expect(insight.summary.warnings).toBeGreaterThan(0);
    expect(insight.warnings.some((w) => w.toLowerCase().includes("urgent queue"))).toBe(true);

    const priorities = insight.actionPlan.map((a) => a.priority);
    const firstHighOrNormal = priorities.findIndex((p) => p !== "critical");
    expect(firstHighOrNormal).toBeGreaterThanOrEqual(0);
    expect(priorities.slice(0, firstHighOrNormal).every((p) => p === "critical")).toBe(true);

    expect(insight.derived.effectiveFte).toBe(7);
    expect(insight.derived.slaBreachRatePct).toBe(15);
    expect(insight.derived.queueVelocityDelta).toBe(5);
  });

  it("marks optional whitespace fields as optional and does not treat them as required", () => {
    const insight = analyzeTeamCapacity({
      capacityText: [
        "team_size=18",
        "available_capacity_fte=14",
        "in_flight_work_items=22",
        "avg_cycle_days=5",
        "urgent_queue=3",
        "specialist_gap_count=0",
        "overtime_pct=6",
        "key_skill_note=Cross-trained team."
      ].join("\n"),
      sourceLabel: "minimal-required.txt",
      question: "Any blockers?"
    });

    const optionalRow = insight.whitespaceRows.find((row) => row.fieldWording === "SLA breach count");
    expect(optionalRow?.optional).toBe(true);
    expect(optionalRow?.status).toBe("MISSING");

    const requiredRow = insight.whitespaceRows.find((row) => row.fieldWording === "Team size");
    expect(requiredRow?.optional).toBe(false);
    expect(requiredRow?.status).toBe("EXTRACTED");
  });
});

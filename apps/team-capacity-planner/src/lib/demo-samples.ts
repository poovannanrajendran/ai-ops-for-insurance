export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  capacityText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "balanced-team",
    label: "Balanced — property",
    description: "Property London Market treaty team. Healthy utilisation, on-target cycle time, low urgent queue.",
    sourceLabel: "property-treaty-team-w13-2026.txt",
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
      "key_skill_note=Two trained alternates for each key process; property cat and surplus lines certified."
    ].join("\n"),
    question: "What should the manager highlight in this week's allocation note?"
  },
  {
    id: "overloaded-team",
    label: "Overloaded — casualty",
    description: "Casualty and D&O syndicate team. High urgent queue, SLA breaches, intake outpacing throughput.",
    sourceLabel: "casualty-do-team-w13-2026.txt",
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
      "key_skill_note=Two classes rely on a single senior D&O reviewer; three new joiners not yet signed off on US casualty line."
    ].join("\n"),
    question: "Where is overload risk and what actions should be taken immediately?"
  },
  {
    id: "watch-team",
    label: "Watch — marine cargo",
    description: "Marine cargo open-cover team. Elevated cycle time and growing referral backlog but within thresholds.",
    sourceLabel: "marine-cargo-team-w13-2026.txt",
    capacityText: [
      "team_name=Marine Cargo — Open Cover Desk",
      "reporting_week=2026-W13",
      "team_size=12",
      "available_capacity_fte=11",
      "absentee_count=0",
      "in_flight_work_items=26",
      "avg_cycle_days=8",
      "target_cycle_days=6",
      "urgent_queue=6",
      "sla_breach_count=2",
      "new_submissions_week=13",
      "specialist_gap_count=1",
      "referral_backlog=5",
      "overtime_pct=13",
      "key_skill_note=One specialist sanctions screener on annual leave; Red Sea routing queries generating above-average referral volume."
    ].join("\n"),
    question: "What is the SLA exposure and what actions can prevent escalation?"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Incomplete payload — core metrics absent. Triggers required-field validation.",
    sourceLabel: "missing-required-team-capacity.txt",
    capacityText: [
      "team_name=Draft Team",
      "team_size=",
      "available_capacity_fte=",
      "urgent_queue=5",
      "key_skill_note=Draft pack only — metrics pending."
    ].join("\n"),
    question: "Can we still publish a capacity plan from this data?"
  }
];

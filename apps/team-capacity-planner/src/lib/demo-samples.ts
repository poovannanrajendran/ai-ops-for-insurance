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
    label: "Balanced team",
    description: "Capacity available with manageable queue and low overtime.",
    sourceLabel: "balanced-team-capacity.txt",
    capacityText:
      "team_size=18\navailable_capacity_fte=14\nin_flight_work_items=22\navg_cycle_days=5\nurgent_queue=3\nspecialist_gap_count=0\novertime_pct=6\nkey_skill_note=Property and casualty team has two trained alternates for each key process.",
    question: "What should the manager highlight in this week's allocation note?"
  },
  {
    id: "overloaded-team",
    label: "Overloaded team",
    description: "High urgent queue and overtime requiring immediate reallocation.",
    sourceLabel: "overloaded-team-capacity.txt",
    capacityText:
      "team_size=16\navailable_capacity_fte=8\nin_flight_work_items=41\navg_cycle_days=11\nurgent_queue=14\nspecialist_gap_count=4\novertime_pct=24\nkey_skill_note=Two classes rely on a single senior reviewer; new joiners not yet signed off.",
    question: "Where is overload risk and what actions should be taken now?"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Incomplete payload to trigger required field validation.",
    sourceLabel: "missing-required-team-capacity.txt",
    capacityText: "team_size=\navailable_capacity_fte=\nurgent_queue=5\nkey_skill_note=Draft pack only.",
    question: "Can we still publish a capacity plan?"
  }
];

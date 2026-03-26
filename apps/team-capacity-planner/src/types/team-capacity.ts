export type ExtractionStatus = "EXTRACTED" | "MISSING";

export interface TeamCapacityFields {
  team_name: string;
  reporting_week: string;
  team_size: number | null;
  available_capacity_fte: number | null;
  absentee_count: number | null;
  in_flight_work_items: number | null;
  avg_cycle_days: number | null;
  target_cycle_days: number | null;
  urgent_queue: number | null;
  sla_breach_count: number | null;
  new_submissions_week: number | null;
  specialist_gap_count: number | null;
  referral_backlog: number | null;
  overtime_pct: number | null;
  key_skill_note: string;
}

export interface DerivedMetrics {
  effectiveFte: number;
  utilizationRate: number;
  utilizationPct: number;
  slaBreachRatePct: number;
  queueVelocityDelta: number;
  cycleVsTarget: number | null;
  capacityRunwayDays: number | null;
}

export interface TeamCapacityWhitespaceRow {
  fieldWording: string;
  extractedValue: string;
  status: ExtractionStatus;
  optional?: boolean;
}

export interface TeamCapacityInsight {
  summary: {
    completenessPct: number;
    capacityState: "healthy" | "watch" | "overloaded";
    confidence: "high" | "medium" | "low";
    warnings: number;
  };
  derived: DerivedMetrics;
  extractedFields: TeamCapacityFields;
  allocationNarrative: string[];
  actionPlan: Array<{ priority: "critical" | "high" | "normal"; action: string }>;
  promptHits: string[];
  warnings: string[];
  whitespaceRows: TeamCapacityWhitespaceRow[];
}

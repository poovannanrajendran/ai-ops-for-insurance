export type ExtractionStatus = "EXTRACTED" | "MISSING";

export interface TeamCapacityFields {
  team_size: number | null;
  available_capacity_fte: number | null;
  in_flight_work_items: number | null;
  avg_cycle_days: number | null;
  urgent_queue: number | null;
  specialist_gap_count: number | null;
  overtime_pct: number | null;
  key_skill_note: string;
}

export interface TeamCapacityWhitespaceRow {
  fieldWording: string;
  extractedValue: string;
  status: ExtractionStatus;
}

export interface TeamCapacityInsight {
  summary: {
    completenessPct: number;
    capacityState: "healthy" | "watch" | "overloaded";
    confidence: "high" | "medium" | "low";
  };
  extractedFields: TeamCapacityFields;
  allocationNarrative: string[];
  actionPlan: string[];
  promptHits: string[];
  warnings: string[];
  whitespaceRows: TeamCapacityWhitespaceRow[];
}

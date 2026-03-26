export type ExtractionStatus = "EXTRACTED" | "MISSING";

export interface QbrInputFields {
  gwp_gbp: number | null;
  loss_ratio_pct: number | null;
  ntu_rate_pct: number | null;
  combined_ratio_pct: number | null;
  premium_delta_pct: number | null;
  renewal_retention_pct: number | null;
  open_claims_count: number | null;
  broker_mix_note: string;
}

export interface QbrWhitespaceRow {
  fieldWording: string;
  extractedValue: string;
  status: ExtractionStatus;
}

export interface QbrNarrativeInsight {
  summary: {
    completenessPct: number;
    performanceState: "improving" | "stable" | "deteriorating";
    narrativeConfidence: "high" | "medium" | "low";
  };
  extractedFields: QbrInputFields;
  executiveNarrative: string[];
  boardTalkingPoints: string[];
  promptHits: string[];
  warnings: string[];
  whitespaceRows: QbrWhitespaceRow[];
}

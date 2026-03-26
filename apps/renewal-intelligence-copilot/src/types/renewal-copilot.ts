export type Severity = "high" | "medium" | "low";
export type RenewalStrategy = "renew_flat" | "rate_increase_required" | "refer_to_senior" | "decline_renewal";

export interface RenewalStrategyRecommendation {
  strategy: RenewalStrategy;
  rationale: string;
}

export interface PricingSignal {
  driver: string;
  direction: "increase" | "decrease" | "hold";
  impactPct: number;
  severity: Severity;
}

export interface RenewalSummary {
  pricingDirection: "increase" | "decrease" | "hold";
  recommendedMovementPct: number;
  highRiskDrivers: number;
  openActions: number;
  technicalRateAdequacyPct: number;
}

export interface RenewalCopilotInsight {
  summary: RenewalSummary;
  strategyMemo: string[];
  negotiationTalkingPoints: string[];
  pricingSignals: PricingSignal[];
  actionPlan: string[];
  renewalStrategy: RenewalStrategyRecommendation;
  warnings: string[];
  queryHits: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
}

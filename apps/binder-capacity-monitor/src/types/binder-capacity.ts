export interface BinderRow {
  riskId: string;
  insuredName: string;
  binderName: string;
  classOfBusiness: string;
  territory: string;
  boundAmountGbp: number;
  binderCapacityGbp: number;
  forecastAdditionalGbp: number;
  daysToExpiry: number;
  status: string;
}

export interface BinderSummary {
  binderName: string;
  rowCount: number;
  capacityGbp: number;
  usedGbp: number;
  remainingGbp: number;
  usedPct: number;
  forecastUsedGbp: number;
  forecastRemainingGbp: number;
  forecastUsedPct: number;
  currentBand: "green" | "amber" | "red";
  forecastBand: "green" | "amber" | "red";
  breachRisk: "stable" | "watch" | "near_breach" | "likely_breach" | "breached";
}

export interface BinderWarning {
  code: "current_breach" | "forecast_breach" | "concentration" | "low_headroom" | "data_inconsistency";
  message: string;
}

export interface BreakdownMetric {
  label: string;
  amountGbp: number;
  sharePct: number;
  forecastAmountGbp: number;
  forecastSharePct: number;
}

export interface TopRiskMetric {
  riskId: string;
  insuredName: string;
  classOfBusiness: string;
  territory: string;
  boundAmountGbp: number;
  forecastExposureGbp: number;
  sharePct: number;
  daysToExpiry: number;
  status: string;
}

export interface BinderCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface BinderInsight {
  summary: BinderSummary;
  warnings: BinderWarning[];
  classBreakdown: BreakdownMetric[];
  territoryBreakdown: BreakdownMetric[];
  topRisks: TopRiskMetric[];
  queryHits: string[];
  commentary: BinderCommentary;
}

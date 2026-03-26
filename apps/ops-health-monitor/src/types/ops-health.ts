export type Severity = "high" | "medium" | "low";

export interface OpsMetric {
  name: string;
  current: number;
  target: number;
  previous: number;
  owner: string;
  direction: "higher_better" | "lower_better";
  deltaToTargetPct: number;
  trendDeltaPct: number;
  severity: Severity;
}

export interface OpsHealthSummary {
  metricsEvaluated: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  overallState: "stable" | "watch" | "critical";
}

export interface OpsHealthInsight {
  summary: OpsHealthSummary;
  metricBoard: OpsMetric[];
  anomalyAlerts: string[];
  briefingNarrative: string[];
  actionPlan: string[];
  queryHits: string[];
  warnings: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
}

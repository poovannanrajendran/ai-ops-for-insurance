export interface ExposureRow {
  scheduleId: string;
  policyId: string;
  insuredName: string;
  location: string;
  country: string;
  peril: string;
  periodStart: string;
  periodEnd: string;
  tivGbp: number;
  limitGbp: number;
}

export interface ClashFinding {
  clashId: string;
  schedulePair: string;
  policyPair: string;
  insuredName: string;
  location: string;
  country: string;
  peril: string;
  overlapDays: number;
  combinedTivGbp: number;
  combinedLimitGbp: number;
  severity: "medium" | "high";
  rationale: string;
}

export interface ClashSummary {
  totalRows: number;
  schedulesDetected: number;
  clashesDetected: number;
  highSeverityClashes: number;
}

export interface ConcentrationMetric {
  label: string;
  clashCount: number;
  totalCombinedTivGbp: number;
}

export interface ExposureClashInsight {
  summary: ClashSummary;
  clashes: ClashFinding[];
  countryConcentration: ConcentrationMetric[];
  perilConcentration: ConcentrationMetric[];
  warnings: string[];
  queryHits: string[];
  commentary: string;
}

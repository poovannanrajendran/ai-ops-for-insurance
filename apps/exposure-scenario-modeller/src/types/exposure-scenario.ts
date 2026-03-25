export interface ExposureScenarioRow {
  exposureId: string;
  accountName: string;
  country: string;
  peril: string;
  segment: string;
  tivGbp: number | null;
  attachmentGbp: number | null;
  limitGbp: number | null;
}

export interface RequiredFieldStatus {
  fieldName: string;
  matchedRows: number;
  totalRows: number;
  coveragePct: number;
  status: "matched" | "missing";
}

export interface RequiredFieldGate {
  passed: boolean;
  fieldCoveragePct: number;
  missingFields: string[];
  fields: RequiredFieldStatus[];
  rationale: string;
}

export interface ScenarioResult {
  scenarioId: "baseline" | "stressed";
  title: string;
  grossModelledLossGbp: number;
  netModelledLossGbp: number;
  lossRatioPct: number;
  concentrationLoadPct: number;
  affectedExposureCount: number;
  topDriver: string;
  commentary: string;
}

export interface ConcentrationInsight {
  dimension: "country" | "peril" | "segment";
  label: string;
  exposureCount: number;
  totalTivGbp: number;
  sharePct: number;
  stressedLossGbp: number;
  insight: string;
}

export interface QuerySnippet {
  label: string;
  snippet: string;
  rationale: string;
}

export interface ExposureScenarioSummary {
  rowCount: number;
  totalTivGbp: number;
  totalLimitGbp: number;
  gatePassed: boolean;
  baselineNetLossGbp: number;
  stressedNetLossGbp: number;
  stressDeltaPct: number;
}

export interface ExposureScenarioCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface ExposureScenarioAnalysis {
  summary: ExposureScenarioSummary;
  requiredFieldGate: RequiredFieldGate;
  scenarios: ScenarioResult[];
  concentrationInsights: ConcentrationInsight[];
  querySnippets: QuerySnippet[];
  warnings: string[];
  commentary: ExposureScenarioCommentary;
}

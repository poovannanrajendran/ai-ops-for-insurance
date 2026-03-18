export type ConfidenceBand = "high" | "medium" | "low";

export type CobLabel =
  | "Property"
  | "Marine Cargo"
  | "Casualty / Liability"
  | "Cyber"
  | "Financial Lines"
  | "Aviation"
  | "Energy"
  | "Construction"
  | "Accident & Health"
  | "Specialty Other";

export interface KeywordSignal {
  label: CobLabel;
  keyword: string;
  weight: number;
  snippet: string;
  rationale: string;
}

export interface CobCandidate {
  label: CobLabel;
  confidence: number;
  confidenceBand: ConfidenceBand;
  reasoning: string;
  matchedSignals: string[];
}

export interface CobWarning {
  code: "low_confidence" | "ambiguous_classification" | "sparse_signals";
  message: string;
}

export interface CobCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface QueryHit {
  fieldName: string;
  snippet: string;
}

export interface CobSummary {
  topLabel: CobLabel;
  topConfidence: number;
  confidenceBand: ConfidenceBand;
  ambiguous: boolean;
  candidateCount: number;
  totalSignals: number;
}

export interface CobInsight {
  summary: CobSummary;
  candidates: CobCandidate[];
  keywordSignals: KeywordSignal[];
  warnings: CobWarning[];
  commentary: CobCommentary;
  query: {
    question: string | null;
    hits: QueryHit[];
  };
}

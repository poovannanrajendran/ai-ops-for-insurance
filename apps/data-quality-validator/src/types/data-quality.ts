export type Severity = "high" | "medium" | "low";

export interface QualityIssue {
  rowRef: string;
  column: string;
  issue: string;
  severity: Severity;
}

export interface DataQualitySummary {
  rowsEvaluated: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  qualityState: "pass" | "watch" | "fail";
}

export interface DataQualityInsight {
  summary: DataQualitySummary;
  issues: QualityIssue[];
  fixSuggestions: string[];
  briefingNarrative: string[];
  queryHits: string[];
  warnings: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
}

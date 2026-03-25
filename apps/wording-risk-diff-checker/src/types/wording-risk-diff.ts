export type ChangeType = "added" | "removed" | "changed";
export type Severity = "high" | "medium" | "low";
export type RiskTag =
  | "administrative"
  | "claims_obligation"
  | "coverage_expansion"
  | "coverage_restriction"
  | "exclusion_change"
  | "financial_shift"
  | "operational_condition"
  | "territory_scope";

export interface ParsedClause {
  key: string;
  section: string;
  label: string;
  value: string;
  normalizedValue: string;
}

export interface ClauseDiff {
  clauseKey: string;
  section: string;
  label: string;
  changeType: ChangeType;
  baselineValue: string | null;
  revisedValue: string | null;
  severity: Severity;
  tags: RiskTag[];
  rationale: string;
  isMaterial: boolean;
}

export interface DiffWarning {
  code:
    | "coverage_restriction_shift"
    | "financial_shift_detected"
    | "multiple_material_changes"
    | "sparse_wording_input";
  message: string;
}

export interface DiffSummary {
  totalComparedClauses: number;
  stableCount: number;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  materialChangeCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
}

export interface ExecutiveBrief {
  headline: string;
  narrative: string;
  actions: string[];
}

export interface WordingRiskDiffInsight {
  summary: DiffSummary;
  warnings: DiffWarning[];
  executiveBrief: ExecutiveBrief;
  clauseDiffs: ClauseDiff[];
  parsedBaselineClauses: ParsedClause[];
  parsedRevisedClauses: ParsedClause[];
  queryHits: string[];
}

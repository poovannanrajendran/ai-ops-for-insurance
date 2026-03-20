export type ChangeType = "added" | "removed" | "changed";
export type Severity = "high" | "medium" | "low";

export interface ParsedClause {
  key: string;
  label: string;
  section: string;
  value: string;
}

export interface ClauseDiff {
  changeType: ChangeType;
  expiringValue: string | null;
  isMaterial: boolean;
  label: string;
  rationale: string;
  renewalValue: string | null;
  section: string;
  severity: Severity;
}

export interface DiffWarning {
  code: "critical_shift" | "multiple_material_changes" | "coverage_restriction" | "sparse_wording";
  message: string;
}

export interface DiffSummary {
  addedCount: number;
  changedCount: number;
  highSeverityCount: number;
  lowSeverityCount: number;
  materialChangeCount: number;
  mediumSeverityCount: number;
  removedCount: number;
  stableCount: number;
  totalComparedClauses: number;
}

export interface ExecutiveBrief {
  headline: string;
  actionPoints: string[];
  findings: string[];
  queryResponse: string;
}

export interface PolicyEndorsementDiffInsight {
  clauseDiffs: ClauseDiff[];
  executiveBrief: ExecutiveBrief;
  parsedExpiringClauses: ParsedClause[];
  parsedRenewalClauses: ParsedClause[];
  queryHits: string[];
  summary: DiffSummary;
  warnings: DiffWarning[];
}

export type Severity = "high" | "medium" | "low";

export interface SanctionsMatch {
  listName: string;
  matchedEntity: string;
  inputEntity: string;
  similarityScore: number;
  severity: Severity;
  rationale: string;
}

export interface SanctionsSummary {
  entitiesScreened: number;
  highRiskMatches: number;
  mediumRiskMatches: number;
  lowRiskMatches: number;
  screeningState: "clear" | "review" | "block";
  sanctionsDataUpdatedAtDisplay?: string;
}

export interface SanctionsScreeningInsight {
  summary: SanctionsSummary;
  matches: SanctionsMatch[];
  recommendedActions: string[];
  briefingNarrative: string[];
  queryHits: string[];
  warnings: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
}

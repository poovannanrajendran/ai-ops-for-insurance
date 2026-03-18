export type MatchStatus = "matched" | "missing";
export type Severity = "medium" | "high";

export interface SlipFieldMatch {
  fieldName: string;
  extractedValue: string | null;
  status: MatchStatus;
}

export interface SlipStructuredData {
  insuredName: string | null;
  broker: string | null;
  territory: string | null;
  inceptionDate: string | null;
  expiryDate: string | null;
  limit: string | null;
  currency: string | null;
  deductible: string | null;
  sublimits: string[];
  governingLaw: string | null;
  jurisdiction: string | null;
  claimsNotification: string | null;
  keyExclusions: string[];
  subjectivities: string[];
}

export interface ClauseFlag {
  severity: Severity;
  clause: string;
  rationale: string;
}

export interface GapFlag {
  severity: Severity;
  gap: string;
  rationale: string;
}

export interface SlipReviewCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface QueryHit {
  fieldName: string;
  snippet: string;
}

export interface SlipReviewSummary {
  fieldCoverage: number;
  matchedFields: number;
  missingFields: number;
  gatePassed: boolean;
  missingRequiredFields: string[];
}

export interface SlipReviewInsight {
  structuredData: SlipStructuredData;
  fieldMatches: SlipFieldMatch[];
  unusualClauses: ClauseFlag[];
  coverageGaps: GapFlag[];
  commentary: SlipReviewCommentary;
  summary: SlipReviewSummary;
  query: {
    question: string | null;
    hits: QueryHit[];
  };
}

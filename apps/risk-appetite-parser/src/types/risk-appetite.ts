export type MatchStatus = "matched" | "missing";

export interface WhitespaceFieldMatch {
  fieldName: string;
  extractedValue: string | null;
  status: MatchStatus;
}

export interface RiskAppetiteStructuredData {
  insuredName: string | null;
  classOfBusiness: string[];
  territory: string[];
  maxLineSize: string | null;
  currency: string | null;
  minimumPremium: string | null;
  inceptionDate: string | null;
  expiryDate: string | null;
  excludedRisks: string[];
  subjectivities: string[];
  referralTriggers: string[];
  conditions: string[];
}

export interface RiskAppetiteSummary {
  fieldCoverage: number;
  matchedFields: number;
  missingFields: number;
}

export interface AppetiteWarning {
  severity: "medium" | "high";
  message: string;
}

export interface RiskAppetiteCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface QueryHit {
  fieldName: string;
  snippet: string;
}

export interface RiskAppetiteInsight {
  structuredData: RiskAppetiteStructuredData;
  whitespaceFields: WhitespaceFieldMatch[];
  warnings: AppetiteWarning[];
  commentary: RiskAppetiteCommentary;
  summary: RiskAppetiteSummary;
  query: {
    question: string | null;
    hits: QueryHit[];
  };
}

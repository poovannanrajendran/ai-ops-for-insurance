export type TriageDisposition = "fast-track" | "manual-review" | "escalate";

export interface ParsedFnol {
  claimReference: string | null;
  insuredName: string | null;
  classOfBusiness: string | null;
  lossDate: string | null;
  reportedDate: string | null;
  location: string | null;
  causeOfLoss: string | null;
  estimatedReserveGbp: number | null;
  currency: string | null;
  injuryCount: number;
  thirdPartyInjury: boolean;
  fatalityIndicator: boolean;
  policeReport: boolean | null;
  fraudIndicator: boolean;
  claimantRepresented: boolean;
  litigationIndicator: boolean;
  propertyDamageSeverity: "minor" | "moderate" | "severe" | "unknown";
  businessInterruptionDays: number;
  missingFieldCount: number;
}

export interface TriageFactor {
  code:
    | "fatality"
    | "injury"
    | "fraud"
    | "litigation"
    | "reserve"
    | "missing_data"
    | "police_report"
    | "damage_severity"
    | "business_interruption"
    | "complex_cause";
  contribution: number;
  detail: string;
}

export interface TriageWarning {
  code: "escalate_now" | "data_gap" | "claims_governance";
  message: string;
}

export interface TriageSummary {
  disposition: TriageDisposition;
  triageScore: number;
  reserveBand: string;
  injuryCount: number;
  missingFieldCount: number;
  warningCount: number;
}

export interface TriageDecision {
  disposition: TriageDisposition;
  headline: string;
  rationale: string;
  nextActions: string[];
}

export interface FnolTriageInsight {
  parsedFnol: ParsedFnol;
  summary: TriageSummary;
  factors: TriageFactor[];
  warnings: TriageWarning[];
  decision: TriageDecision;
  queryHits: string[];
}

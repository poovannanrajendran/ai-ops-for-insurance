export type AppetiteDecision = "accept" | "refer" | "decline";

export interface ExtractedSubmission {
  broker: string | null;
  brokerContact?: string | null;
  insuredName?: string | null;
  headquarters?: string | null;
  attachment?: string | null;
  business?: string | null;
  revenue?: string | null;
  employees?: string | null;
  locations?: string | null;
  construction?: string | null;
  occupancy?: string | null;
  fireProtection?: string | null;
  natCat?: string | null;
  riskControls?: string | null;
  claimsHistory?: string | null;
  lossHistory?: string | null;
  expiringCarrier?: string | null;
  expiringPremium?: string | null;
  desiredInception?: string | null;
  brokerObjective?: string | null;
  notes?: string | null;
  classOfBusiness: string;
  territory: string;
  currency: string | null;
  limitAmount: number | null;
  warningFlags: string[];
  fields: Record<string, string>;
}

export interface SubmissionAnalysis {
  extracted: ExtractedSubmission;
  decision: AppetiteDecision;
  confidence: number;
  rationale: string[];
}

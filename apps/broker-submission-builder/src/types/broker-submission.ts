export type StatusTone = "green" | "amber" | "red";
export type SubmissionReadiness = "ready" | "referral";

export interface BrokerSubmissionFields {
  broker: string;
  insuredName: string;
  classOfBusiness: string;
  territory: string;
  inceptionDate: string;
  requestedLimitGbp: number;
  attachmentGbp: number;
  estimatedPremiumGbp: number;
  claimsSummary: string;
  securityRequirements: string;
  targetQuoteBy: string;
  narrative: string;
  revenueGbp: number;
  occupancies: string;
}

export interface ReferralFlag {
  code: string;
  severity: StatusTone;
  message: string;
}

export interface InformationGap {
  label: string;
  impact: string;
  action: string;
}

export interface SubmissionSection {
  title: string;
  bullets: string[];
}

export interface SubmissionStatusMetric {
  label: string;
  tone: StatusTone;
  value: string;
}

export interface BrokerSubmissionSummary {
  completenessPct: number;
  referralCount: number;
  redFlagCount: number;
  informationGapCount: number;
  readiness: SubmissionReadiness;
  marketStance: string;
}

export interface BrokerSubmissionInsight {
  summary: BrokerSubmissionSummary;
  fields: BrokerSubmissionFields;
  sections: SubmissionSection[];
  referralFlags: ReferralFlag[];
  informationGaps: InformationGap[];
  statusMetrics: SubmissionStatusMetric[];
  queryHits: string[];
  commentary: string;
}

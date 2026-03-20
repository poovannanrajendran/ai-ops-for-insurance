export interface ReferralRecord {
  brokerTier: string;
  claimsActivity: boolean;
  classOfBusiness: string;
  daysToInception: number;
  insuredName: string;
  lossRatioPct: number;
  missingFieldsCount: number;
  newBusiness: boolean;
  quotedPremiumGbp: number;
  referralId: string;
  referralReason: string;
  sanctionsFlag: boolean;
  territory: string;
  tivGbp: number;
}

export interface ScoreFactor {
  code:
    | "missing_fields"
    | "sanctions"
    | "time_pressure"
    | "loss_ratio"
    | "tiv"
    | "premium"
    | "new_business"
    | "claims_activity"
    | "referral_reason"
    | "broker_tier"
    | "territory_scope";
  contribution: number;
  detail: string;
}

export interface RankedReferral {
  complexityBand: "complex" | "standard" | "streamlined";
  factorBreakdown: ScoreFactor[];
  recommendation: string;
  referral: ReferralRecord;
  score: number;
  urgencyBand: "critical" | "high" | "moderate" | "routine";
}

export interface QueueSummary {
  averageScore: number;
  criticalCount: number;
  highCount: number;
  highestScore: number;
  moderateCount: number;
  queueCount: number;
  routineCount: number;
}

export interface QueueWarning {
  code: "critical_backlog" | "sanctions_present" | "data_gaps";
  message: string;
}

export interface QueueInsight {
  queryHits: string[];
  rankedReferrals: RankedReferral[];
  summary: QueueSummary;
  topDrivers: string[];
  warnings: QueueWarning[];
}

export interface ClaimsRow {
  claimId: string;
  policyId: string;
  claimantName: string;
  causeOfLoss: string;
  lossDate: string;
  notifiedDate: string;
  reserveGbp: number;
  incurredGbp: number;
  paidGbp: number;
  status: string;
}

export interface LeakageFlag {
  code: string;
  score: number;
  message: string;
}

export interface LeakageFinding {
  claimId: string;
  policyId: string;
  claimantName: string;
  causeOfLoss: string;
  reserveGbp: number;
  incurredGbp: number;
  leakageScore: number;
  severity: "medium" | "high";
  flags: LeakageFlag[];
}

export interface LeakageSummary {
  totalClaims: number;
  flaggedClaims: number;
  highSeverityClaims: number;
  estimatedLeakageGbp: number;
}

export interface RuleCount {
  code: string;
  count: number;
}

export interface ClaimsLeakageInsight {
  summary: LeakageSummary;
  findings: LeakageFinding[];
  ruleCounts: RuleCount[];
  warnings: string[];
  queryHits: string[];
  commentary: string;
}

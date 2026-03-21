export interface TreatyTerms {
  treatyType: string;
  subjectBusiness: string;
  territory: string;
  attachmentGbp: number;
  limitGbp: number;
  cedingCommissionPct: number;
  reinstatements: number;
  signedSharePct: number;
}

export interface LayerBand {
  label: string;
  fromGbp: number;
  toGbp: number;
  payer: string;
}

export interface LossScenario {
  title: string;
  grossLossGbp: number;
  cedantRetainedGbp: number;
  reinsurerPaidGbp: number;
  uninsuredAboveLimitGbp: number;
}

export interface TreatyWarning {
  code: string;
  message: string;
  severity: "amber" | "red";
}

export interface TreatyInsight {
  terms: TreatyTerms;
  layerBands: LayerBand[];
  narrative: string[];
  scenarios: LossScenario[];
  warnings: TreatyWarning[];
  queryHits: string[];
  commentary: string;
}

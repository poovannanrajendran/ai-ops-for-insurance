export interface PortfolioRecord {
  rowNumber: number;
  accountName: string | null;
  classOfBusiness: string;
  territory: string;
  limitAmount: number;
  currency: string | null;
}

export interface DistributionBucket {
  label: string;
  count: number;
  share: number;
}

export interface PortfolioSummary {
  totalRecords: number;
  classDistribution: DistributionBucket[];
  territoryDistribution: DistributionBucket[];
  limitBandDistribution: DistributionBucket[];
  currencies: string[];
}

export interface PortfolioAnalysis {
  records: PortfolioRecord[];
  summary: PortfolioSummary;
}

export interface ConcentrationWarning {
  dimension: "class" | "territory" | "limitBand";
  label: string;
  share: number;
  severity: "medium" | "high";
  message: string;
}

export interface PortfolioCommentary {
  executiveSummary: string;
  observations: string[];
  actions: string[];
}

export interface PortfolioInsight extends PortfolioAnalysis {
  warnings: ConcentrationWarning[];
  commentary: PortfolioCommentary;
}

export const SHARED_SCHEMA_PREFIX = "app_";

export interface AppMetadata {
  slug: string;
  shortName: string;
  displayName: string;
  schema: string;
  devPort: number;
}

export const submissionTriageApp: AppMetadata = {
  slug: "submission-triage-copilot",
  shortName: "submissiontriage",
  displayName: "Submission Triage Copilot",
  schema: `${SHARED_SCHEMA_PREFIX}submissiontriage`,
  devPort: 3001
};

export const portfolioMixApp: AppMetadata = {
  slug: "portfolio-mix-dashboard",
  shortName: "portfoliomix",
  displayName: "Portfolio Mix Dashboard",
  schema: `${SHARED_SCHEMA_PREFIX}portfoliomix`,
  devPort: 3002
};

export const riskAppetiteApp: AppMetadata = {
  slug: "risk-appetite-parser",
  shortName: "riskappetite",
  displayName: "Risk Appetite Parser",
  schema: `${SHARED_SCHEMA_PREFIX}riskappetite`,
  devPort: 3001
};

export const slipReviewerApp: AppMetadata = {
  slug: "slip-reviewer",
  shortName: "slipreviewer",
  displayName: "Slip Reviewer",
  schema: `${SHARED_SCHEMA_PREFIX}slipreviewer`,
  devPort: 3001
};

export const classOfBusinessApp: AppMetadata = {
  slug: "class-of-business-classifier",
  shortName: "classofbusiness",
  displayName: "Class of Business Classifier",
  schema: `${SHARED_SCHEMA_PREFIX}classofbusiness`,
  devPort: 3005
};

export const exposureHeatmapApp: AppMetadata = {
  slug: "exposure-accumulation-heatmap",
  shortName: "exposureheatmap",
  displayName: "Exposure Accumulation Heatmap",
  schema: `${SHARED_SCHEMA_PREFIX}exposureheatmap`,
  devPort: 3006
};

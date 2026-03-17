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

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

export const catEventBriefingApp: AppMetadata = {
  slug: "cat-event-briefing",
  shortName: "cateventbriefing",
  displayName: "Cat Event Briefing",
  schema: `${SHARED_SCHEMA_PREFIX}cateventbriefing`,
  devPort: 3007
};

export const policyEndorsementDiffApp: AppMetadata = {
  slug: "policy-endorsement-diff-checker",
  shortName: "policyendorsementdiff",
  displayName: "Policy Endorsement Diff Checker",
  schema: `${SHARED_SCHEMA_PREFIX}policyendorsementdiff`,
  devPort: 3008
};

export const referralPriorityQueueApp: AppMetadata = {
  slug: "referral-priority-queue-scorer",
  shortName: "referralqueuescorer",
  displayName: "Referral Priority Queue Scorer",
  schema: `${SHARED_SCHEMA_PREFIX}referralqueuescorer`,
  devPort: 3009
};

export const claimsFnolTriageApp: AppMetadata = {
  slug: "claims-fnol-triage-assistant",
  shortName: "fnoltriage",
  displayName: "Claims FNOL Triage Assistant",
  schema: `${SHARED_SCHEMA_PREFIX}fnoltriage`,
  devPort: 3010
};

export const binderCapacityMonitorApp: AppMetadata = {
  slug: "binder-capacity-monitor",
  shortName: "bindercapacity",
  displayName: "Binder Capacity Monitor",
  schema: `${SHARED_SCHEMA_PREFIX}bindercapacity`,
  devPort: 3011
};

export const treatyStructureExplainerApp: AppMetadata = {
  slug: "treaty-structure-explainer",
  shortName: "treatystructure",
  displayName: "Treaty Structure Explainer",
  schema: `${SHARED_SCHEMA_PREFIX}treatystructure`,
  devPort: 3012
};

export const exposureClashDetectorApp: AppMetadata = {
  slug: "exposure-clash-detector",
  shortName: "exposureclash",
  displayName: "Exposure Clash Detector",
  schema: `${SHARED_SCHEMA_PREFIX}exposureclash`,
  devPort: 3013
};

export const claimsLeakageFlaggerApp: AppMetadata = {
  slug: "claims-leakage-flagger",
  shortName: "claimsleakage",
  displayName: "Claims Leakage Flagger",
  schema: `${SHARED_SCHEMA_PREFIX}claimsleakage`,
  devPort: 3014
};

export interface RegulatorySample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  feedText: string;
  classFocus: string;
  question: string;
}

const balancedFeed = `SOURCE: Lloyd's Market Bulletin
TITLE: Claims data quality and bordereaux filing cadence update
DATE: 2026-02-18
CLASS: Property; Marine Cargo
UPDATE: Managing agents must evidence monthly bordereaux reconciliation controls and exception tracking by Q2 2026.
ACTION: Confirm bordereaux quality controls, assign owner, and prepare attestation notes.
---
SOURCE: FCA Handbook Notice
TITLE: Conduct expectations for product governance reviews
DATE: 2026-02-25
CLASS: Liability; Financial Lines
UPDATE: Firms should document annual product governance reviews with clear customer-outcome rationale and pricing evidence.
ACTION: Schedule governance review pack and capture pricing rationale in approval minutes.
---
SOURCE: PRA Consultation
TITLE: Operational resilience scenario-testing reminder
DATE: 2026-03-03
CLASS: Property; Cyber
UPDATE: Consultation reiterates scenario-testing expectations for severe-but-plausible disruptions and dependency mapping.
ACTION: Refresh resilience scenario library and map key third-party dependencies.`;

const highUrgencyFeed = `SOURCE: OFSI Notice
TITLE: Financial sanctions designation update
DATE: 2026-03-08
CLASS: Marine Cargo; Trade Credit
UPDATE: Immediate sanctions designation update introduces additional restricted entities for shipping and trade finance routes.
ACTION: Run sanctions screening refresh, pause in-scope binding activity, and escalate matches to compliance immediately.
---
SOURCE: FCA Dear CEO Letter
TITLE: Claims handling timeliness and fair value follow-up
DATE: 2026-03-11
CLASS: Motor; Liability
UPDATE: FCA expects firms to evidence prompt claims progression and root-cause remediation for delayed settlement cohorts.
ACTION: Produce delayed-claims MI pack, agree remediation plan, and set board oversight dates.
---
SOURCE: Lloyd's Bulletin
TITLE: Delegated authority control deadline
DATE: 2026-03-14
CLASS: Property; Liability
UPDATE: Managing agents are required to complete delegated authority control remediation before 30 April 2026 deadline.
ACTION: Confirm remediation owner and submit signed completion tracker before deadline.`;

const missingGateFeed = `SOURCE: Market Note
TITLE: Short update
DATE: 2026-03-15
CLASS: 
UPDATE: Watch for changes.
ACTION: `;

export const demoSamples: RegulatorySample[] = [
  {
    id: "balanced-multisource",
    label: "Balanced multisource",
    description: "Mixed Lloyd's, FCA, and PRA updates with clear action items.",
    sourceLabel: "balanced-regulatory-feed.txt",
    feedText: balancedFeed,
    classFocus: "Property, Liability",
    question: "Which updates require underwriting governance action this month?"
  },
  {
    id: "urgent-sanctions-conduct",
    label: "Urgent sanctions",
    description: "Higher urgency sanctions and conduct updates requiring immediate controls.",
    sourceLabel: "urgent-sanctions-feed.txt",
    feedText: highUrgencyFeed,
    classFocus: "Marine Cargo, Trade Credit, Liability",
    question: "What must be escalated immediately and why?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete feed to trigger minimum bulletin and field validation.",
    sourceLabel: "missing-required-feed.txt",
    feedText: missingGateFeed,
    classFocus: "Property",
    question: "What is missing from this feed?"
  }
];

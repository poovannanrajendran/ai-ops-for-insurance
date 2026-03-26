export interface MeetingPrepSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  briefingText: string;
  question: string;
}

const balancedBriefing = `CLIENT: Northbridge Food Ingredients Ltd
MEETING DATE: 2026-04-14
BROKER: Aegis Specialty Partners
LINE OF BUSINESS: Products Liability / Property Combined
UNDERWRITER: London Property & Liability Team
OBJECTIVE: Renewal terms discussion and capacity confirmation for combined programme
PREMIUM: £380,000 prior year; proposed movement +6% reflecting inflationary exposure uplift
LOSS RATIO: 42% five-year average; nil claims in current year; one minor subrogation recovered in 2023
LIMIT: £25,000,000 any one occurrence; £50,000,000 aggregate
DEDUCTIBLE: £100,000 own damage; £250,000 products liability
POSITIVES: No material claims in five years; upgraded plant CCTV and sprinkler maintenance logs complete; ISO 22000 accreditation renewed
RISKS: One unresolved product recall matter in active legal defence; dependency on two key raw material suppliers in single geography; deductible adequacy review overdue
OPEN ITEMS: Confirm supply-chain testing cadence documentation; validate deductible preference against peer benchmarks; obtain updated EML survey report
STAKEHOLDERS: CFO, Risk Manager, Broking Lead, Claims Advocate
DECISION DEADLINE: 2026-04-25
MARKET CONDITIONS: Stable to slightly hardening for food sector; capacity broadly available at benchmark terms`;

const highRiskBriefing = `CLIENT: Atlas Maritime Logistics
MEETING DATE: 2026-04-09
BROKER: Harbour Placement LLP
LINE OF BUSINESS: Marine Cargo — Open Cover
UNDERWRITER: Marine Cargo Referral Desk
OBJECTIVE: Mid-term review after sanctions route disruption and cargo theft cluster
PREMIUM: £1,200,000 annualised; current year projected to £1,450,000 on adjusted declarations
LOSS RATIO: 87% current year; 64% prior year; adverse claims development on high-value electronics cargo
LIMIT: USD 15,000,000 any one sending; EML under review pending updated voyage routing
DEDUCTIBLE: USD 50,000 per occurrence; theft sub-limit USD 500,000
POSITIVES: Strong internal audit cadence and quarterly compliance training; automated declaration system in place
RISKS: Two recent near-miss sanctions alerts on Russia-adjacent routing; delayed declarations from one regional office creating bordereau gaps; unresolved high-value cargo theft claim USD 2.1M in adjudication; loss ratio exceeds 80% referral threshold
OPEN ITEMS: Confirm sanctions control ownership and document routing override authority; evidence declaration remediation timetable; agree interim capacity guardrails pending EML re-survey; obtain signed compliance attestation
STAKEHOLDERS: COO, Compliance Lead, Broking Director, Claims Counsel, Sanctions Officer
DECISION DEADLINE: 2026-04-11
MARKET CONDITIONS: Hardening; marine cargo capacity constrained following Red Sea disruption; markets seeking rate increases of 15–25% on adverse-loss accounts`;

const missingGateBriefing = `CLIENT: Short Note Co
MEETING DATE:
OBJECTIVE: Quick discussion
RISKS:
OPEN ITEMS:
STAKEHOLDERS:`;

export const demoSamples: MeetingPrepSample[] = [
  {
    id: "balanced-renewal-briefing",
    label: "Balanced renewal",
    description:
      "Complete renewal pack with financial metrics, moderate risk cues, and clear next actions for a food ingredients client.",
    sourceLabel: "balanced-renewal-briefing",
    briefingText: balancedBriefing,
    question: "What should we cover first in the meeting agenda?"
  },
  {
    id: "high-risk-referral",
    label: "High-risk referral",
    description:
      "Compressed timeline with sanctions alerts, adverse loss ratio, and open claims requiring referral and compliance sign-off.",
    sourceLabel: "high-risk-referral",
    briefingText: highRiskBriefing,
    question: "Which points need immediate escalation before authority sign-off?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete input to trigger required-field validation and the missing-gate flow.",
    sourceLabel: "missing-required-gate",
    briefingText: missingGateBriefing,
    question: "What data is missing?"
  }
];

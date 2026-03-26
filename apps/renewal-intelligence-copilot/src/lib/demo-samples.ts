export interface RenewalCopilotSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  renewalText: string;
  question: string;
}

const balancedRenewal = `INSURED: Meridian Foods Plc
CLASS: Property
BROKER: Aegis Specialty Partners
POLICY PERIOD: 2026-07-01 to 2027-06-30
CURRENT PREMIUM GBP: 185000
PRIOR YEAR PREMIUM GBP: 178000
LOSS RATIO PCT: 42
CLAIMS TREND: Stable frequency with one moderate machinery claim
EXPOSURE CHANGE PCT: 6
RISK CONTROLS: Upgraded alarm monitoring, quarterly engineering survey complete
MARKET CONDITIONS: Capacity available but underwriter caution on food processing fire loads
INSURED VALUE GBP: 42000000
LIMIT GBP: 5000000
EML GBP: 2900000
DEDUCTIBLE GBP: 50000
LTA: Not in place
TARGET EFFECTIVE DATE: 2026-07-01
BROKER OBJECTIVE: Secure stable terms and avoid deductible increase`;

const hardeningRenewal = `INSURED: Atlas Marine Logistics
CLASS: Marine Cargo
BROKER: North Wharf Broking
POLICY PERIOD: 2026-06-15 to 2027-06-14
CURRENT PREMIUM GBP: 420000
PRIOR YEAR PREMIUM GBP: 350000
LOSS RATIO PCT: 89
CLAIMS TREND: Frequency increase with two theft losses and one high-severity spoilage event
EXPOSURE CHANGE PCT: 14
RISK CONTROLS: Incomplete route-security evidence and delayed sanctions control attestation
MARKET CONDITIONS: Capacity tightening and elevated deductible appetite in segment
INSURED VALUE GBP: 88000000
LIMIT GBP: 9000000
EML GBP: 7800000
DEDUCTIBLE GBP: 25000
LTA: 3-year LTA with +/- 5% annual movement band
TARGET EFFECTIVE DATE: 2026-06-15
BROKER OBJECTIVE: Retain line size while preventing punitive premium movement`;

const missingGateRenewal = `INSURED: Short Note Co
CLASS: Property
CURRENT PREMIUM GBP:
LOSS RATIO PCT:
CLAIMS TREND:
EXPOSURE CHANGE PCT:
RISK CONTROLS:
MARKET CONDITIONS:
TARGET EFFECTIVE DATE:
BROKER OBJECTIVE:`;

export const demoSamples: RenewalCopilotSample[] = [
  {
    id: "balanced-renewal",
    label: "Balanced renewal",
    description: "Moderate exposure uplift with stable loss ratio and strong controls.",
    sourceLabel: "balanced-renewal-pack.txt",
    renewalText: balancedRenewal,
    question: "What pricing direction should we propose and why?"
  },
  {
    id: "hardening-market",
    label: "Hardening market",
    description: "Higher loss pressure and weaker controls requiring stronger negotiation plan.",
    sourceLabel: "hardening-renewal-pack.txt",
    renewalText: hardeningRenewal,
    question: "What points should be escalated before renewal authority?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete pack to trigger required-field validation.",
    sourceLabel: "missing-required-renewal.txt",
    renewalText: missingGateRenewal,
    question: "What data is missing?"
  }
];

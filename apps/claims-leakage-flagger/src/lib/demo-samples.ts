export interface ClaimsLeakageSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  claimsText: string;
  question: string;
}

export const demoSamples: ClaimsLeakageSample[] = [
  {
    id: "high-leakage-indicators",
    label: "High Leakage Signals",
    description: "Contains late notification, reserve pressure, and duplicate indicators.",
    sourceLabel: "high-leakage-indicators.csv",
    claimsText: `claim_id,policy_id,claimant_name,cause_of_loss,loss_date,notified_date,reserve_gbp,incurred_gbp,paid_gbp,status
CLM-1001,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-10,95000,162000,88000,Open
CLM-1002,POL-778,Helios Engineering,Water Damage,2026-01-05,2026-03-12,82000,140000,73000,Open
CLM-2004,POL-410,Northstar Logistics,Third-party Injury,2026-02-14,2026-02-20,240000,315000,150000,Reopened
CLM-2005,POL-410,Northstar Logistics,Third-party Injury,2026-02-14,2026-02-21,180000,212000,92000,Open`,
    question: "Which claims should be prioritised for leakage review?"
  },
  {
    id: "mostly-stable",
    label: "Mostly Stable",
    description: "Low leakage pressure with one medium warning.",
    sourceLabel: "mostly-stable.csv",
    claimsText: `claim_id,policy_id,claimant_name,cause_of_loss,loss_date,notified_date,reserve_gbp,incurred_gbp,paid_gbp,status
CLM-501,POL-220,Brightlane Foods,Fire,2026-02-03,2026-02-05,125000,119000,54000,Open
CLM-502,POL-221,Marlin Retail,Flood,2026-02-11,2026-02-13,68000,71000,26000,Open
CLM-503,POL-222,Urban Workshop Ltd,Theft,2026-02-18,2026-03-05,48000,52000,22000,Open`,
    question: "Are there any concerning leakage markers in this run?"
  },
  {
    id: "missing-required-gate",
    label: "Missing Required Gate",
    description: "Intentionally incomplete payload to trigger required-field checks.",
    sourceLabel: "missing-required-gate.csv",
    claimsText: `claim_id,policy_id,claimant_name
CLM-1,POL-1,Test`,
    question: "What fields are missing?"
  }
];

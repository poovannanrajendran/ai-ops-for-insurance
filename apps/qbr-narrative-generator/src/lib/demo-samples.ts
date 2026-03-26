export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  qbrText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "balanced-quarter",
    label: "Balanced quarter",
    description: "Aegis Property & Marine — Q1 2026. Healthy renewal, new business growth, stable loss ratio, and well-diversified broker flow.",
    sourceLabel: "aegis-property-marine-q1-2026-qbr.txt",
    qbrText: [
      "company_name=Aegis Specialty Underwriting Ltd",
      "class_of_business=Property & Marine Combined",
      "quarter=Q1 2026",
      "gwp_gbp=14750000",
      "loss_ratio_pct=51",
      "ntu_rate_pct=10",
      "combined_ratio_pct=91",
      "premium_delta_pct=9",
      "renewal_retention_pct=89",
      "open_claims_count=18",
      "large_loss_count=1",
      "new_business_gwp_gbp=2100000",
      "broker_mix_note=Book diversified across Marsh, Willis, and Howden. UK domiciled risks at 54%; Nordic and Benelux at 28%; MENA at 18%. No single broker >30% of GWP.",
      "market_conditions_note=Property market stable to slightly hardening; marine cargo capacity tightening post Red Sea disruption but no material rate dislocation yet."
    ].join("\n"),
    question: "What should the quarterly board narrative focus on?"
  },
  {
    id: "pressure-quarter",
    label: "Pressure quarter — deteriorating",
    description: "Hartwell Casualty Syndicate — Q3 2025. Elevated attritional loss activity, slipping retention, and two large losses driving a combined ratio above 105%.",
    sourceLabel: "hartwell-casualty-q3-2025-qbr.txt",
    qbrText: [
      "company_name=Hartwell Casualty Syndicate 2847",
      "class_of_business=Casualty — General & Products Liability",
      "quarter=Q3 2025",
      "gwp_gbp=9400000",
      "loss_ratio_pct=76",
      "ntu_rate_pct=22",
      "combined_ratio_pct=108",
      "premium_delta_pct=-5",
      "renewal_retention_pct=68",
      "open_claims_count=47",
      "large_loss_count=2",
      "new_business_gwp_gbp=580000",
      "broker_mix_note=Casualty flow concentrated — two distributors account for 61% of GWP. Late bordereau submissions from one distributor delayed loss development visibility for six weeks.",
      "market_conditions_note=US casualty market hardening on social inflation concerns; London following with 10–18% rate increases on adverse-loss accounts. Capacity providers reducing line sizes."
    ].join("\n"),
    question: "How should we explain the deterioration and near-term remediation actions to the board?"
  },
  {
    id: "improving-quarter",
    label: "Improving quarter — recovery",
    description: "Meridian Energy & Political Risk — Q4 2025. Strong GWP growth, improving loss ratio after prior-year attritional spike, and positive market conditions.",
    sourceLabel: "meridian-energy-polrisk-q4-2025-qbr.txt",
    qbrText: [
      "company_name=Meridian Energy & Political Risk Ltd",
      "class_of_business=Energy Onshore & Political Risk Combined",
      "quarter=Q4 2025",
      "gwp_gbp=21300000",
      "loss_ratio_pct=44",
      "ntu_rate_pct=8",
      "combined_ratio_pct=86",
      "premium_delta_pct=14",
      "renewal_retention_pct=92",
      "open_claims_count=11",
      "large_loss_count=0",
      "new_business_gwp_gbp=4800000",
      "broker_mix_note=Energy book led by Lockton and BMS. Political risk flow via specialist boutiques. Geographic spread: MENA 42%, Sub-Saharan Africa 31%, Latin America 27%.",
      "market_conditions_note=Energy onshore hardening significantly; upstream markets +20–35% on rate. Political risk capacity constrained in MENA and Francophone Africa; Meridian well-positioned on established relationships."
    ].join("\n"),
    question: "What are the key growth and profitability messages for the year-end board review?"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Incomplete metrics payload — company name and most financials absent. Designed to trigger required-field validation and demonstrate the missing-gate error flow.",
    sourceLabel: "incomplete-qbr-draft.txt",
    qbrText: [
      "company_name=",
      "class_of_business=Marine Cargo",
      "quarter=Q2 2026",
      "gwp_gbp=",
      "loss_ratio_pct=",
      "ntu_rate_pct=17",
      "broker_mix_note=Limited fields supplied from draft prep sheet — full metrics pending finance sign-off."
    ].join("\n"),
    question: "Can we still draft a reliable QBR narrative from this pack?"
  }
];

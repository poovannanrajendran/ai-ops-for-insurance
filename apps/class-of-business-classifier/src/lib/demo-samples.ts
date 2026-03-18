export interface DemoSample {
  id: string;
  label: string;
  sourceLabel: string;
  description: string;
  riskText: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "property-clean",
    label: "Property",
    sourceLabel: "property-warehouse-risk.txt",
    description: "Clear property signals with buildings and BI wording.",
    riskText: `Insured operates three food-distribution warehouses in the United Kingdom and Ireland.
Coverage requested is property damage and business interruption with a sum insured of GBP 18,000,000.
Buildings include cold storage and automated handling systems.
Risk controls include sprinkler protection, weekly alarm testing, and documented maintenance logs.`
  },
  {
    id: "cyber-vs-financial",
    label: "Cyber / Financial",
    sourceLabel: "mixed-cyber-financial-signals.txt",
    description: "Ambiguous profile to test close confidence and warnings.",
    riskText: `Insured is a regulated fintech platform providing payment processing across Europe.
The board requests directors and officers protection plus incident response support for ransomware events.
The proposal references data breach costs, network interruption, and allegations against senior management decisions.
Requested wording should include cyber extortion and management liability coverage considerations.`
  },
  {
    id: "missing-data-gate",
    label: "Minimum data gate",
    sourceLabel: "short-risk-note.txt",
    description: "Intentionally short note to trigger minimum text validation.",
    riskText: `Need a quote for liability cover for a small manufacturer in the UK.`
  }
];

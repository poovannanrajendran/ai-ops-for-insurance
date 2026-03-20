export interface DemoSample {
  description: string;
  expiringText: string;
  id: string;
  label: string;
  question: string;
  renewalText: string;
  sourceLabel: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "territory_restriction",
    label: "Territory restriction",
    sourceLabel: "synthetic-property-renewal-territory.txt",
    description: "Renewal narrows territory, adds cyber exclusion, and increases deductible.",
    question: "Which changes are materially restrictive for the underwriter to escalate?",
    expiringText: `Policy Reference: PROP-44812\nClass: Property\nTerritory: United Kingdom, Ireland, France, Germany\nLimit of Liability: GBP 10,000,000 any one occurrence\nDeductible: GBP 25,000 each and every loss\nCyber Exclusion: Silent cyber carve-back for physical damage is included\nRisk Improvements:\n- Sprinkler maintenance certificates every 12 months\n- Night watchman required for vacant locations longer than 30 days`,
    renewalText: `Policy Reference: PROP-44812\nClass: Property\nTerritory: United Kingdom and Ireland only\nLimit of Liability: GBP 10,000,000 any one occurrence\nDeductible: GBP 100,000 each and every loss\nCyber Exclusion: Absolute cyber exclusion applies with no carve-back\nRisk Improvements:\n- Sprinkler maintenance certificates every 6 months\n- Night watchman required for any vacant location\nClaims Notification: Notify all losses within 14 days`
  },
  {
    id: "limit_reduction",
    label: "Limit reduction",
    sourceLabel: "synthetic-liability-limit-shift.txt",
    description: "Renewal reduces liability limit and adds sanctions wording while keeping the structure clean.",
    question: "Summarise the high-severity changes in plain English.",
    expiringText: `Policy Reference: CAS-10294\nClass: General Liability\nTerritory: United Kingdom, Europe\nLimit of Liability: GBP 5,000,000 any one claim\nAggregate Limit: GBP 10,000,000\nSanctions Clause: Standard market sanctions wording\nContractual Liability: Included where assumed under written contract\nJurisdiction: United Kingdom and European Union`,
    renewalText: `Policy Reference: CAS-10294\nClass: General Liability\nTerritory: United Kingdom, Europe\nLimit of Liability: GBP 2,500,000 any one claim\nAggregate Limit: GBP 5,000,000\nSanctions Clause: Broadened sanctions wording including immediate suspension rights\nContractual Liability: Included where assumed under written contract\nJurisdiction: United Kingdom only`
  },
  {
    id: "minimum_gate",
    label: "Minimum gate",
    sourceLabel: "short-note.txt",
    description: "Intentionally too short to trip the required input gate.",
    question: "What changed?",
    expiringText: `Territory: UK\nLimit: GBP 1m`,
    renewalText: `Territory: UK only\nLimit: GBP 1m`
  }
];

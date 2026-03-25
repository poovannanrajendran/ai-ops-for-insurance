export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  baselineText: string;
  revisedText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "coverage_restriction",
    label: "Restrictive renewal",
    description: "Narrows territory, raises retention, and hardens cyber and notice wording.",
    sourceLabel: "synthetic-property-coverage-restriction-pair.txt",
    question: "Which wording changes are materially restrictive?",
    baselineText: `Policy Schedule: PROP-72144\nCoverage:\nTerritory: United Kingdom, Ireland, France, Germany\nLimit of Liability: GBP 10,000,000 any one occurrence\nDeductible: GBP 25,000 each and every loss\nCyber Exclusion: Silent cyber carve-back for direct physical damage is included\nClaims Notification: Notify circumstances as soon as practicable\nConditions:\n- Sprinkler impairment to be reported within 30 days\n- Vacant premises subject to weekly inspection`,
    revisedText: `Policy Schedule: PROP-72144\nCoverage:\nTerritory: United Kingdom and Ireland only\nLimit of Liability: GBP 7,500,000 any one occurrence\nDeductible: GBP 100,000 each and every loss\nCyber Exclusion: Absolute cyber exclusion applies with no carve-back\nClaims Notification: Notify all losses within 14 days\nConditions:\n- Sprinkler impairment to be reported within 7 days\n- Vacant premises subject to daily inspection and prior insurer approval`
  },
  {
    id: "coverage_expansion",
    label: "Broader wording",
    description: "Expands jurisdiction and sublimits while keeping exclusions stable.",
    sourceLabel: "synthetic-liability-expansion-pair.txt",
    question: "Where has the wording become broader?",
    baselineText: `Policy Reference: CAS-88201\nCoverage:\nJurisdiction: United Kingdom only\nLimit of Liability: GBP 2,500,000 any one claim\nAggregate Limit: GBP 5,000,000\nContractual Liability: Included where assumed under written contract\nExclusions:\nSanctions Clause: Standard market sanctions wording`,
    revisedText: `Policy Reference: CAS-88201\nCoverage:\nJurisdiction: United Kingdom, European Union, and Switzerland\nLimit of Liability: GBP 5,000,000 any one claim\nAggregate Limit: GBP 10,000,000\nContractual Liability: Included where assumed under written contract and ancillary services\nExclusions:\nSanctions Clause: Standard market sanctions wording`
  },
  {
    id: "minimum_gate",
    label: "Minimum gate",
    description: "Short wording input to demonstrate the required route gate.",
    sourceLabel: "short-note.txt",
    question: "What changed?",
    baselineText: `Territory: UK\nLimit: GBP 1m`,
    revisedText: `Territory: UK only\nLimit: GBP 1m`
  }
];

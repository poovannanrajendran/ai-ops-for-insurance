export interface BrokerSubmissionSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  submissionText: string;
  question: string;
}

export const demoSamples: BrokerSubmissionSample[] = [
  {
    id: "mid-market-property-ready",
    label: "Ready Property",
    description: "Complete broker pack with clean claims and market-ready controls.",
    sourceLabel: "mid-market-property-ready.txt",
    submissionText: `Broker: Aegis Specialty Partners
Insured Name: Northbridge Food Ingredients Ltd
Class of Business: Property
Territory: United Kingdom and Ireland
Inception Date: 2026-07-01
Requested Limit: GBP 5,000,000
Attachment: GBP 500,000
Estimated Premium: GBP 185,000
Revenue: GBP 42,000,000
Occupancies: Dry food blending, packaging, and warehouse distribution
Claims Summary: No material losses in the past five years; one attritional stock spill closed below deductible.
Security Requirements: LPCB alarm, full perimeter CCTV, monitored sprinkler protection, and segregated combustible storage.
Target Quote By: 2026-04-04
Narrative: Established ingredient blender supplying private-label retail contracts from two sprinklered sites. Management confirms no change in process hazard, no overseas exports outside Ireland, and a planned renewal remarket to secure broader stock throughput wording.`,
    question: "What should appear in the market summary for this submission?"
  },
  {
    id: "us-product-liability-referral",
    label: "Referral Liability",
    description: "Higher-hazard liability placement with large line demand and adverse claims narrative.",
    sourceLabel: "us-product-liability-referral.txt",
    submissionText: `Broker: Meridian Wholesale Risks
Insured Name: HarborGlow Nutrition Inc.
Class of Business: Product Liability
Territory: United States and Canada
Inception Date: 2026-06-15
Requested Limit: GBP 20,000,000
Attachment: GBP 250,000
Estimated Premium: GBP 1,150,000
Revenue: GBP 180,000,000
Occupancies: Nutritional supplements manufacturing, contract packing, and North American distribution
Claims Summary: Two open bodily injury matters and one 2025 product recall remain under active defence with incurred spend above USD 3,200,000.
Security Requirements: Batch traceability in place, but third-party plant audit remediation and supplier contamination testing remain in progress.
Target Quote By: 2026-03-29
Narrative: Broker is seeking a new lead after incumbent reduced appetite. The insured is pressing for urgent turnaround to satisfy distributor covenant requirements while quality assurance upgrades and supplier testing actions are still being completed after the recall event.`,
    question: "Why does this need referral before release to market?"
  },
  {
    id: "missing-required-gate",
    label: "Missing Gate",
    description: "Intentionally incomplete broker note to trigger required-field validation.",
    sourceLabel: "missing-required-gate.txt",
    submissionText: `Broker: Example Wholesale
Insured Name: Example Manufacturing Ltd
Class of Business: Property
Requested Limit: GBP 3,000,000
Narrative: Short note only.`,
    question: "Which fields are missing?"
  }
];

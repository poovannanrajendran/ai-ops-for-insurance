export interface TreatySample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  treatyText: string;
  question: string;
}

export const demoSamples: TreatySample[] = [
  {
    id: "balanced-xol",
    label: "Balanced XoL",
    description:
      "Clear excess-of-loss structure with moderate attachment and one paid reinstatement.",
    sourceLabel: "balanced-xol.txt",
    treatyText: `Treaty Type: Excess of Loss
Subject Business: UK commercial property
Territory: United Kingdom
Attachment: GBP 2,500,000
Limit: GBP 7,500,000
Ceding Commission: 12.5%
Signed Share: 100%
Reinstatements: 1`,
    question: "Explain who pays at GBP 2m, GBP 6m, and GBP 12m loss levels."
  },
  {
    id: "low-attach-high-volatility",
    label: "Low Attach Volatility",
    description: "Low attachment can increase frequency utilisation pressure.",
    sourceLabel: "low-attach-volatility.txt",
    treatyText: `Treaty Type: Excess of Loss
Subject Business: Global marine cargo
Territory: Global excluding sanctioned territories
Attachment: GBP 500,000
Limit: GBP 3,000,000
Ceding Commission: 8%
Signed Share: 85%
Reinstatements: 0`,
    question: "Where is the volatility concern in this structure?"
  },
  {
    id: "missing-fields-gate",
    label: "Missing Required Gate",
    description: "Intentionally incomplete to trigger required-field validation.",
    sourceLabel: "missing-required-gate.txt",
    treatyText: `Treaty Type: Excess of Loss
Subject Business: Property`,
    question: "What is missing?"
  }
];

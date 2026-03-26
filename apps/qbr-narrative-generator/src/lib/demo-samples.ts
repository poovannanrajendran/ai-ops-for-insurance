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
    description: "Healthy renewal, steady loss ratio, and manageable open claims.",
    sourceLabel: "balanced-qbr-pack.txt",
    qbrText:
      "gwp_gbp=12500000\nloss_ratio_pct=54\nntu_rate_pct=12\ncombined_ratio_pct=94\npremium_delta_pct=8\nrenewal_retention_pct=87\nopen_claims_count=23\nbroker_mix_note=Property and marine book remains diversified across UK and Benelux brokers.",
    question: "What should the quarterly board narrative focus on?"
  },
  {
    id: "pressure-quarter",
    label: "Pressure quarter",
    description: "Higher attritional losses and slipping retention requiring action commentary.",
    sourceLabel: "pressure-qbr-pack.txt",
    qbrText:
      "gwp_gbp=9800000\nloss_ratio_pct=73\nntu_rate_pct=19\ncombined_ratio_pct=107\npremium_delta_pct=-4\nrenewal_retention_pct=71\nopen_claims_count=41\nbroker_mix_note=Casualty-heavy broker flow concentrated in two distributors with late bordereaux submissions.",
    question: "How should we explain the deterioration and near-term actions?"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Incomplete metrics payload designed to trigger required-field validation.",
    sourceLabel: "missing-required-qbr-pack.txt",
    qbrText: "gwp_gbp=\nloss_ratio_pct=\nntu_rate_pct=15\nbroker_mix_note=Limited fields supplied from draft prep.",
    question: "Can we still draft a reliable QBR paragraph?"
  }
];

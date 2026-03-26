export interface DataQualitySample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  datasetText: string;
  question: string;
}

const balancedDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
SUB-1001,Property,United Kingdom,185000,2026-01-01,2026-12-31
SUB-1002,Casualty,France,92000,2026-02-01,2027-01-31
SUB-1003,Marine Cargo,Germany,131000,2026-03-15,2027-03-14`;

const driftDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
SUB-2001,Property,United Kingdom,-25000,2026-01-01,2026-12-31
SUB-2001,Casualty,France,92000,2026-02-01,2025-12-31
SUB-2003,,Germany,131000,2026-03-15,2027-03-14`;

const missingDataset = `record_id,class_of_business,country,premium_gbp,inception_date
SUB-3001,Property,United Kingdom,185000,2026-01-01
SUB-3002,Casualty,France,,2026-02-01`;

export const demoSamples: DataQualitySample[] = [
  {
    id: "balanced-dataset",
    label: "Balanced quality pack",
    description: "Complete sample with valid dates, IDs, and premium values.",
    sourceLabel: "balanced-quality-dataset.csv",
    datasetText: balancedDataset,
    question: "Are there any validation concerns before ingestion?"
  },
  {
    id: "quality-drift",
    label: "Drifted quality pack",
    description: "Duplicate IDs, negative premium, and date-order issues for remediation.",
    sourceLabel: "quality-drift-dataset.csv",
    datasetText: driftDataset,
    question: "Which issues are high severity and need immediate correction?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete structure to trigger required-field checks.",
    sourceLabel: "missing-required-quality-dataset.csv",
    datasetText: missingDataset,
    question: "Which required fields are missing?"
  }
];

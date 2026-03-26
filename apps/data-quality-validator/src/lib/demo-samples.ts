export interface DataQualitySample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  datasetText: string;
  question: string;
}

// 9-row clean portfolio slice across London Market lines and geographies.
// All required fields present, IDs unique, premiums positive, dates valid ISO.
const balancedDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
RIS-4201,Property — Industrial All Risks,United Kingdom,485000,2026-01-01,2026-12-31
RIS-4202,Marine Cargo — Open Cover,Singapore,312000,2026-02-01,2027-01-31
RIS-4203,Casualty — General Liability,United States,920000,2026-03-01,2027-02-28
RIS-4204,Energy Onshore,United Arab Emirates,1850000,2026-04-01,2027-03-31
RIS-4205,Aviation Hull,Germany,675000,2026-01-15,2027-01-14
RIS-4206,Political Risk,Brazil,230000,2026-05-01,2027-04-30
RIS-4207,Directors and Officers,France,148000,2026-03-15,2027-03-14
RIS-4208,Property — Commercial,Japan,395000,2026-06-01,2027-05-31
RIS-4209,Marine Hull,Norway,560000,2026-02-15,2027-02-14`;

// 11-row dataset with 7 deliberate quality defects spanning all check types:
// duplicate ID, negative premium, expiry before inception, missing class,
// missing country, invalid date format, missing premium, missing record ID.
const driftDataset = `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date
RIS-5001,Property — Industrial All Risks,United Kingdom,320000,2026-01-01,2026-12-31
RIS-5001,Marine Cargo — Open Cover,France,185000,2026-02-01,2027-01-31
RIS-5003,Casualty — General Liability,Germany,-15000,2026-03-01,2027-02-28
RIS-5004,Energy Onshore,United Arab Emirates,740000,2026-06-30,2026-03-31
RIS-5005,,United States,530000,2026-04-01,2027-03-31
RIS-5006,Aviation Hull,,910000,2026-05-01,2027-04-30
RIS-5007,Political Risk,Brazil,275000,15/07/2026,15/07/2027
RIS-5008,Directors and Officers,Japan,,2026-08-01,2027-07-31
,Property — Commercial,Singapore,460000,2026-09-01,2027-08-31
RIS-5010,Marine Hull,Norway,195000,2026-10-01,2027-09-30
RIS-5011,Terrorism,Australia,88000,2026-11-01,2027-10-31`;

// Header missing the expiry_date column — triggers required-column validation gate.
// Premium and record_id also contain edge cases to surface additional issues
// once the schema gate is resolved.
const missingColumnDataset = `record_id,class_of_business,country,premium_gbp,inception_date
RIS-6001,Property — Industrial All Risks,United Kingdom,295000,2026-01-01
RIS-6002,Marine Cargo,Germany,0,2026-02-01
RIS-6003,,France,114000,2026-03-15
RIS-6004,Casualty — General Liability,United States,880000,2026-04-01`;

export const demoSamples: DataQualitySample[] = [
  {
    id: "balanced-dataset",
    label: "Balanced quality pack",
    description: "9-row London Market portfolio slice across property, marine, casualty, energy, aviation, and political risk. All fields valid.",
    sourceLabel: "balanced-london-market-dataset.csv",
    datasetText: balancedDataset,
    question: "Are there any validation concerns before ingestion?"
  },
  {
    id: "quality-drift",
    label: "Drifted quality pack",
    description: "11-row dataset with duplicate ID, negative premium, date inversion, missing class, missing country, invalid date format, and blank record ID.",
    sourceLabel: "quality-drift-london-market.csv",
    datasetText: driftDataset,
    question: "Which issues are high severity and need immediate correction before ingestion?"
  },
  {
    id: "missing-required-gate",
    label: "Missing column gate",
    description: "Header is missing the expiry_date column. Triggers required-column schema validation before any row-level checks run.",
    sourceLabel: "missing-column-dataset.csv",
    datasetText: missingColumnDataset,
    question: "Which required columns are absent from the schema?"
  }
];

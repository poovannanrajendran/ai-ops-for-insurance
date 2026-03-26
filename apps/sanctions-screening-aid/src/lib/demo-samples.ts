export interface SanctionsSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  screeningText: string;
  question: string;
}

const balancedScreen = `insured_entity=Northbridge Food Ingredients Ltd
beneficial_owner=Meridian Holdings Plc
broker=Atlas Specialty Broker LLP
territory=United Kingdom; Ireland
counterparty=Harborline Logistics GmbH`;

const highRiskScreen = `insured_entity=Baltic Export Trading JSC
beneficial_owner=Almazov Industrial Group
broker=Orion Placement LLC
territory=United Arab Emirates; Turkey
counterparty=TransEastern Commodities FZE`;

const missingScreen = `insured_entity=
beneficial_owner=Meridian Holdings Plc
broker=
territory=United Kingdom
counterparty=`;

export const demoSamples: SanctionsSample[] = [
  {
    id: "balanced-screening-pack",
    label: "Balanced screening pack",
    description: "Low-risk entities with no close sanctions-list overlap.",
    sourceLabel: "balanced-sanctions-screening.txt",
    screeningText: balancedScreen,
    question: "Any entities requiring manual review?"
  },
  {
    id: "high-risk-screening-pack",
    label: "High risk screening pack",
    description: "Deliberately high-overlap names to trigger blocking controls.",
    sourceLabel: "high-risk-sanctions-screening.txt",
    screeningText: highRiskScreen,
    question: "Which matches trigger block-level action?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Incomplete entity fields to trigger required-field validation.",
    sourceLabel: "missing-required-sanctions-screening.txt",
    screeningText: missingScreen,
    question: "What fields are missing?"
  }
];

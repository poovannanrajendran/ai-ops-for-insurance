export const balancedPortfolioCsv = `account_name,class_of_business,territory,limit_amount,currency
Northwind Logistics,Marine Cargo,United Kingdom,2500000,GBP
Harbor Retail Group,Property,United States,5000000,USD
Emerald Foods,Product Recall,Europe,3000000,EUR
Summit Energy,Property,United States,7500000,USD
Fjord Marine,Marine Cargo,Europe,2000000,EUR`;

export const usPropertyConcentrationCsv = `account_name,class_of_business,territory,limit_amount,currency
Atlas Towers,Property,United States,12000000,USD
Keystone Hospitality,Property,United States,15000000,USD
Beacon Living,Property,United States,11000000,USD
Blue Harbor Estates,Property,United States,9000000,USD
Crown Logistics,Marine Cargo,United Kingdom,2500000,GBP`;

export const malformedPortfolioCsv = `account_name,currency
Northwind Logistics,GBP`;

export const demoSamples = [
  {
    id: "balanced",
    label: "Balanced sample",
    description: "Broad spread across class, territory, and limit bands.",
    csvText: balancedPortfolioCsv
  },
  {
    id: "concentrated",
    label: "US property concentration",
    description: "Triggers class, territory, and large-limit concentration warnings.",
    csvText: usPropertyConcentrationCsv
  },
  {
    id: "malformed",
    label: "Malformed sample",
    description: "Missing required columns to demonstrate validation behavior.",
    csvText: malformedPortfolioCsv
  }
] as const;

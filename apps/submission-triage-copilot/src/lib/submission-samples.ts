export type SubmissionField = readonly [string, string];

const sampleSetOne: SubmissionField[] = [
  ["Broker", "North Harbour Specialty Brokers"],
  ["Broker Contact", "Amelia Hart | amelia.hart@northharbour.example"],
  ["Insured Name", "Crestline Precision Components Ltd"],
  ["Insured", "Crestline Precision Components Ltd"],
  ["Headquarters", "Birmingham, United Kingdom"],
  ["Territory", "United Kingdom"],
  ["Class", "Property"],
  ["Currency", "GBP"],
  ["Limit", "GBP 4,500,000"],
  ["Attachment", "Ground up primary"],
  ["Policy Period", "2026-04-01 to 2027-03-31"],
  ["Target Premium", "GBP 198,000"],
  ["Business", "Precision metal component manufacturing and finished goods warehousing"],
  ["Revenue", "GBP 68,500,000"],
  ["Employees", "245"],
  ["Locations", "2 owned manufacturing sites and 1 leased warehouse"],
  ["Construction", "Brick and steel frame with insulated roof panels"],
  ["Occupancy", "CNC machining, light assembly, storage and dispatch"],
  ["Fire Protection", "Monitored fire alarm, hydrants and sprinkler protection at main plant"],
  ["Nat Cat", "Low flood score, no named wildfire exposure, standard windstorm profile"],
  ["Risk Controls", "Quarterly thermal imaging, hot works permit system, visitor contractor controls"],
  ["Claims History", "One GBP 42,000 stock damage claim in 2022, otherwise clean"],
  ["Loss history", "clean"],
  ["Expiring Carrier", "Evergreen Insurance plc"],
  ["Expiring Premium", "GBP 186,000"],
  ["Desired Inception", "2026-04-01"],
  ["Broker Objective", "Fast indication within current property appetite and guidance on premium range"],
  ["Subjectivities", "Updated sprinkler inspection report prior to bind; signed hot works policy; confirmed valuation date within 18 months."],
  ["Engineering Summary", "Thermographic survey completed January 2026 with no critical findings."],
  ["Notes", "Well managed UK property risk with stable operations, moderate values, and no adverse referral flags."]
];

const sampleSetTwo: SubmissionField[] = [
  ["Broker", "Harbor & Co. Risk Partners"],
  ["Broker Contact", "Daniel Ross | daniel.ross@harborco.example"],
  ["Insured Name", "Meridian Hospitality Group"],
  ["Insured", "Meridian Hospitality Group"],
  ["Headquarters", "Edinburgh, United Kingdom"],
  ["Territory", "United Kingdom"],
  ["Class", "Property"],
  ["Currency", "GBP"],
  ["Limit", "GBP 8,000,000"],
  ["Attachment", "Excess of GBP 250,000"],
  ["Policy Period", "2026-06-01 to 2027-05-31"],
  ["Target Premium", "GBP 312,000"],
  ["Business", "Hotel ownership and management across the UK and Ireland"],
  ["Revenue", "GBP 112,000,000"],
  ["Employees", "620"],
  ["Locations", "10 hotels, 2 conference centers"],
  ["Construction", "Mixed masonry with heritage features"],
  ["Occupancy", "Hospitality, conferencing, and retail tenants"],
  ["Fire Protection", "Full sprinkler coverage in 7/10 sites, enhanced alarms elsewhere"],
  ["Nat Cat", "Moderate windstorm exposure, low flood"],
  ["Risk Controls", "Monthly inspections, 24/7 security, kitchen fire suppression"],
  ["Claims History", "Two water damage claims in 2023 totaling GBP 110,000"],
  ["Loss history", "minor water losses"],
  ["Expiring Carrier", "Blue Shield Insurance"],
  ["Expiring Premium", "GBP 296,000"],
  ["Desired Inception", "2026-06-01"],
  ["Broker Objective", "Secure broader BI cover and maintain premium discipline"],
  ["Notes", "Large hospitality portfolio with active risk improvement plan."]
];

const sampleSetThree: SubmissionField[] = [
  ["Broker", "Atlas Specialty Brokers"],
  ["Broker Contact", "Priya Shah | priya.shah@atlas.example"],
  ["Insured Name", "Summit Logistics Ltd"],
  ["Insured", "Summit Logistics Ltd"],
  ["Headquarters", "Rotterdam, Netherlands"],
  ["Territory", "Europe"],
  ["Class", "Marine"],
  ["Currency", "EUR"],
  ["Limit", "EUR 6,500,000"],
  ["Attachment", "Primary"],
  ["Policy Period", "2026-05-15 to 2027-05-14"],
  ["Target Premium", "EUR 228,000"],
  ["Business", "Freight forwarding and inland transit logistics"],
  ["Revenue", "EUR 54,000,000"],
  ["Employees", "180"],
  ["Locations", "4 logistics hubs across EU"],
  ["Construction", "Modern warehouse and transit facilities"],
  ["Occupancy", "Transit storage and consolidation"],
  ["Fire Protection", "Sprinklers and FM approved alarms"],
  ["Nat Cat", "Low flood; moderate windstorm exposure"],
  ["Risk Controls", "Route monitoring and carrier vetting"],
  ["Claims History", "Single theft loss EUR 65,000 in 2024"],
  ["Loss history", "improving"],
  ["Expiring Carrier", "Continental Marine"],
  ["Expiring Premium", "EUR 214,000"],
  ["Desired Inception", "2026-05-15"],
  ["Broker Objective", "Improve rate stability and add transit extension"],
  ["Notes", "Stable EU marine portfolio with new fleet security controls."]
];

const sampleSetFour: SubmissionField[] = [
  ["Broker", "Oakridge Risk Advisors"],
  ["Broker Contact", "Helen Moore | helen.moore@oakridge.example"],
  ["Insured Name", "Everfield Consumer Electronics"],
  ["Insured", "Everfield Consumer Electronics"],
  ["Headquarters", "Manchester, United Kingdom"],
  ["Territory", "United Kingdom"],
  ["Class", "Property"],
  ["Currency", "GBP"],
  ["Limit", "GBP 12,000,000"],
  ["Attachment", "Excess of GBP 500,000"],
  ["Policy Period", "2026-07-01 to 2027-06-30"],
  ["Target Premium", "GBP 410,000"],
  ["Business", "Electronics distribution and light assembly"],
  ["Revenue", "GBP 145,000,000"],
  ["Employees", "780"],
  ["Locations", "1 HQ, 3 distribution centers"],
  ["Construction", "Steel frame with high-bay storage"],
  ["Occupancy", "Electronics storage and assembly"],
  ["Fire Protection", "Sprinklers in all sites"],
  ["Nat Cat", "Moderate flood exposure at one site"],
  ["Risk Controls", "Seasonal flood plan and emergency generators"],
  ["Claims History", "No major losses; one minor sprinkler leak 2022"],
  ["Loss history", "clean"],
  ["Expiring Carrier", "Unity Insurance"],
  ["Expiring Premium", "GBP 392,000"],
  ["Desired Inception", "2026-07-01"],
  ["Broker Objective", "Secure higher limits; avoid restrictive exclusions"],
  ["Notes", "High values, well-managed risk, some flood sensitivity."]
];

const sampleSetFive: SubmissionField[] = [
  ["Broker", "Northbridge Wholesale"],
  ["Broker Contact", "Kevin Liu | kevin.liu@northbridge.example"],
  ["Insured Name", "Beacon Pharma Manufacturing"],
  ["Insured", "Beacon Pharma Manufacturing"],
  ["Headquarters", "Dublin, Ireland"],
  ["Territory", "Europe"],
  ["Class", "Property"],
  ["Currency", "EUR"],
  ["Limit", "EUR 4,000,000"],
  ["Attachment", "Primary"],
  ["Policy Period", "2026-08-01 to 2027-07-31"],
  ["Target Premium", "EUR 175,000"],
  ["Business", "Pharmaceutical packaging and sterile manufacturing"],
  ["Revenue", "EUR 88,000,000"],
  ["Employees", "310"],
  ["Locations", "2 manufacturing sites, 1 distribution hub"],
  ["Construction", "Cleanroom facilities with reinforced roofing"],
  ["Occupancy", "Sterile packaging and cold storage"],
  ["Fire Protection", "FM approved detection and suppression"],
  ["Nat Cat", "Low flood and wind exposure"],
  ["Risk Controls", "Quarterly audits and cleanroom protocol training"],
  ["Claims History", "No claims in last 5 years"],
  ["Loss history", "clean"],
  ["Expiring Carrier", "Nova Specialty"],
  ["Expiring Premium", "EUR 168,000"],
  ["Desired Inception", "2026-08-01"],
  ["Broker Objective", "Maintain premium while adding machinery breakdown"],
  ["Notes", "Sterile manufacturing exposures with strong controls."]
];

export const sampleSubmissionSets = [
  { label: "submission-sample-1.txt", fields: sampleSetOne },
  { label: "submission-sample-2.txt", fields: sampleSetTwo },
  { label: "submission-sample-3.txt", fields: sampleSetThree },
  { label: "submission-sample-4.txt", fields: sampleSetFour },
  { label: "submission-sample-5.txt", fields: sampleSetFive }
] as const;

export const sampleSubmissionText = sampleSetOne
  .map(([field, value]) => `${field}: ${value}`)
  .join("\n");

export const sampleSpreadsheetRows = [
  ["Field", "Value"],
  ...sampleSetOne
];

export const sampleExposureRows = [
  ["Location", "City", "Country", "Occupancy", "TIV", "Sprinklers", "Flood Zone"],
  ["Main Manufacturing Plant", "Birmingham", "United Kingdom", "Precision components", "GBP 2,100,000", "Yes", "Low"],
  ["Secondary Fabrication Unit", "Coventry", "United Kingdom", "Light fabrication", "GBP 1,250,000", "No", "Low"],
  ["Regional Warehouse", "Leicester", "United Kingdom", "Finished goods storage", "GBP 920,000", "Yes", "Low"]
];

export const sampleLossRunRows = [
  ["Date", "Cause", "Gross Incurred", "Status"],
  ["2022-09-14", "Minor stock water damage", "GBP 42,000", "Closed"],
  ["2023-01-01", "No further claims reported", "GBP 0", "Informational"],
  ["2024-01-01", "No further claims reported", "GBP 0", "Informational"],
  ["2025-01-01", "No further claims reported", "GBP 0", "Informational"]
];

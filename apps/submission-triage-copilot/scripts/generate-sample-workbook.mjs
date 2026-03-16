import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const sampleSpreadsheetRows = [
  ["Field", "Value"],
  ["Broker", "North Harbour Specialty Brokers"],
  ["Broker Contact", "Amelia Hart | amelia.hart@northharbour.example"],
  ["Placing Broker Team", "UK Property, Mid-Market and Facilities Desk"],
  ["Insured", "Crestline Precision Components Ltd"],
  ["Ultimate Parent", "Crestline Industrial Holdings plc"],
  ["Headquarters", "Birmingham, United Kingdom"],
  ["Territory", "United Kingdom"],
  ["Class", "Property"],
  ["Limit", "GBP 4,500,000"],
  ["Attachment", "Ground up primary"],
  ["Policy Period", "2026-04-01 to 2027-03-31"],
  ["Target Premium", "GBP 198,000"],
  ["Business", "Precision metal component manufacturing and finished goods warehousing"],
  ["Revenue", "GBP 68,500,000"],
  ["EBITDA", "GBP 9,800,000"],
  ["Employees", "245"],
  ["Locations", "2 owned manufacturing sites and 1 leased warehouse"],
  ["Values at Risk", "Buildings GBP 2.6m | Machinery GBP 1.2m | Stock GBP 1.5m | BI 12 months"],
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
  ["Subjectivities", "Updated sprinkler inspection report prior to bind; signed hot works policy; confirmed property valuation date within 18 months."],
  ["Engineering Summary", "Main plant completed thermographic survey in January 2026 with no critical findings. Warehouse has segregated lithium-battery charging bay and documented housekeeping checks."],
  ["Notes", "Well managed UK property risk with stable operations, moderate values, no adverse referral flags, and clear risk-improvement ownership from site leadership."]
];

const sampleExposureRows = [
  ["Location", "City", "Country", "Occupancy", "TIV", "Sprinklers", "Flood Zone"],
  ["Main Manufacturing Plant", "Birmingham", "United Kingdom", "Precision components", "GBP 2,100,000", "Yes", "Low"],
  ["Secondary Fabrication Unit", "Coventry", "United Kingdom", "Light fabrication", "GBP 1,250,000", "No", "Low"],
  ["Regional Warehouse", "Leicester", "United Kingdom", "Finished goods storage", "GBP 920,000", "Yes", "Low"]
];

const sampleLossRunRows = [
  ["Date", "Cause", "Gross Incurred", "Status"],
  ["2022-09-14", "Minor stock water damage", "GBP 42,000", "Closed"],
  ["2021-06-03", "Brief machinery breakdown with no BI trigger", "GBP 18,500", "Closed"],
  ["2023-01-01", "No further claims reported", "GBP 0", "Informational"],
  ["2024-01-01", "No further claims reported", "GBP 0", "Informational"],
  ["2025-01-01", "No further claims reported", "GBP 0", "Informational"]
];

const sampleCoverageRows = [
  ["Section", "Requested Cover", "Limit / Basis", "Notes"],
  ["Property Damage", "All risks including accidental damage", "GBP 4,500,000", "Primary layer"],
  ["Business Interruption", "Gross profit", "12 months", "Linked to property damage section"],
  ["Machinery Breakdown", "Included", "GBP 1,200,000", "Key CNC line exposure"],
  ["Stock Throughput", "Not requested", "N/A", "Domestic operations only"],
  ["Terrorism", "Standalone quote required", "Pool Re basis", "Broker open to separate placement"]
];

const sampleRiskImprovementRows = [
  ["Action", "Owner", "Due Date", "Status"],
  ["Provide latest sprinkler maintenance certificate", "Risk Manager", "2026-03-22", "Open"],
  ["Refresh contractor hot works training attendance log", "Operations Director", "2026-03-18", "Open"],
  ["Install leak detection in high-value stock bay", "Facilities Lead", "2026-05-15", "Planned"],
  ["Confirm updated professional valuation", "Broker", "2026-03-25", "In Progress"]
];

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  currentDir,
  "../public/samples/submission-triage-sample.xlsx"
);

mkdirSync(dirname(outputPath), { recursive: true });

const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet(sampleSpreadsheetRows),
  "Submission Brief"
);

XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet(sampleExposureRows),
  "Exposure Schedule"
);

XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet(sampleLossRunRows),
  "Loss Runs"
);

XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet(sampleCoverageRows),
  "Coverage Request"
);

XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet(sampleRiskImprovementRows),
  "Risk Improvements"
);

XLSX.writeFile(workbook, outputPath);

console.log(`Created ${outputPath}`);

export interface DemoSample {
  description: string;
  eventText: string;
  id: string;
  label: string;
  question: string;
  sourceLabel: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "atlantic_windstorm",
    label: "Major windstorm",
    sourceLabel: "lloyds-market-bulletin-windstorm-2026.txt",
    description: "High-severity Atlantic windstorm with emergency declarations and infrastructure disruption.",
    question: "Which classes need urgent referral and what is the first-day action list?",
    eventText: `Event: Severe Atlantic Windstorm Iris\nDate: 2026-03-18\nRegions: United Kingdom, France, Netherlands\nSynopsis: A major windstorm made landfall overnight with sustained winds above 120 mph and widespread infrastructure outage across transport corridors. Authorities issued a state of emergency and evacuation orders in coastal zones. Early reports reference material losses to commercial property, prolonged power interruption, and supply-chain delays affecting ports and logistics hubs.`
  },
  {
    id: "river_flood_cluster",
    label: "Flood cluster",
    sourceLabel: "public-flood-brief-europe-2026.txt",
    description: "Cross-region flood narrative used to test accumulation and BI warning behavior.",
    question: "What accumulation warning and BI impacts should be highlighted?",
    eventText: `Event: Central Europe Flood Sequence\nDate: 2026-03-12\nRegions: Germany, Austria, Czech Republic\nSynopsis: Successive rainfall bands triggered river overflow and flash flood events across multiple industrial and logistics districts. Road and rail links were suspended for several days. Underwriters are seeing early signs of business interruption and contingent business interruption pressure where suppliers are concentrated along the affected river network.`
  },
  {
    id: "required_gate",
    label: "Missing required gate",
    sourceLabel: "short-risk-note.txt",
    description: "Intentionally short bulletin to trigger minimum-content gate.",
    question: "What should be escalated?",
    eventText: `Minor storm reported in one city. Limited impact so far.`
  }
];

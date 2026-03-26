export type Severity = "high" | "medium" | "low";

export interface RegulatoryUpdate {
  id: string;
  source: string;
  title: string;
  publishedOn: string;
  classes: string[];
  update: string;
  action: string;
  severity: Severity;
  relevanceScore: number;
  tags: string[];
}

export interface RegulatorySummary {
  bulletinCount: number;
  relevantCount: number;
  highSeverityCount: number;
  sourceCoverage: string[];
  classFocus: string[];
}

export interface RegulatoryDigestInsight {
  summary: RegulatorySummary;
  executiveBrief: string[];
  priorityAlerts: string[];
  actions: string[];
  updates: RegulatoryUpdate[];
  warnings: string[];
  queryHits: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
}

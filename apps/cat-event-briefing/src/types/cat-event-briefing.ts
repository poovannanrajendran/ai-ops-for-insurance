export interface CatWarning {
  code: "high_severity" | "cross_region_accumulation" | "data_uncertain";
  message: string;
}

export interface CatClassImpact {
  className: string;
  priority: "high" | "medium" | "monitor";
  rationale: string;
}

export interface CatSummary {
  affectedClassesCount: number;
  estimatedLossBand: string;
  eventDate: string | null;
  peril: string;
  regionCount: number;
  severityLabel: string;
  severityScore: number;
}

export interface CatBriefing {
  eventHeadline: string;
  facts: string[];
  impacts: string[];
  suggestedActions: string[];
}

export interface CatHeatPoint {
  intensity: number;
  label: string;
  latitude: number;
  longitude: number;
  weight: number;
}

export interface CatEventInsight {
  affectedClasses: CatClassImpact[];
  briefing: CatBriefing;
  heatPoints: CatHeatPoint[];
  queryHits: string[];
  summary: CatSummary;
  warnings: CatWarning[];
}

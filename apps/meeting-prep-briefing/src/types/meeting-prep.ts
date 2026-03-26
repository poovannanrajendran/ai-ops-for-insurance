export type Severity = "high" | "medium" | "low";
export type UwPosition = "hold" | "negotiate" | "refer" | "decline";
export type MarketContext = "hardening" | "softening" | "stable" | "unknown";

export interface MeetingPackSummary {
  briefingReadiness: "ready" | "needs_follow_up";
  highRiskCount: number;
  openQuestions: number;
  stakeholdersMentioned: number;
}

export interface TalkingPoint {
  title: string;
  message: string;
  severity: Severity;
}

export interface UwPositionRecommendation {
  position: UwPosition;
  rationale: string;
}

export interface AgendaItem {
  order: number;
  item: string;
  note: string;
}

export interface MeetingPrepInsight {
  summary: MeetingPackSummary;
  contextOverview: string[];
  stakeholderMap: string[];
  riskCues: string[];
  talkingPoints: TalkingPoint[];
  openQuestions: string[];
  queryHits: string[];
  warnings: string[];
  whitespaceRows: Array<{
    fieldWording: string;
    extractedValue: string;
    status: "EXTRACTED" | "MISSING";
  }>;
  uwPosition: UwPositionRecommendation;
  agenda: AgendaItem[];
  marketContext: MarketContext;
}

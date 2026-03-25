export type PlacementStatus = "placed" | "quoted" | "open" | "follow-up" | "declined" | "hold";
export type PrioritySeverity = "critical" | "watch" | "stable";

export interface PlacementRow {
  accountName: string;
  broker: string;
  capacityChangePct: number;
  classOfBusiness: string;
  followUpAgeDays: number;
  lineSizeGbp: number;
  marketName: string;
  placementId: string;
  premiumGbp: number;
  quotedSharePct: number;
  signedSharePct: number;
  status: PlacementStatus;
  targetSharePct: number;
  territory: string;
}

export interface PlacementSummary {
  accountName: string;
  leadMarketName: string;
  leadSignedSharePct: number;
  lineSizeGbp: number;
  openMarkets: number;
  openSharePct: number;
  placedMarkets: number;
  placedSharePct: number;
  placementId: string;
  placementProgressPct: number;
  projectedSharePct: number;
  projectedProgressPct: number;
  totalMarkets: number;
  totalTargetSharePct: number;
  weightedCapacityChangePct: number;
}

export interface StatusLane {
  avgFollowUpAgeDays: number;
  count: number;
  label: string;
  sharePct: number;
  status: "placed" | "open";
}

export interface MarketProgress {
  accountName: string;
  broker: string;
  capacityChangePct: number;
  followUpAgeDays: number;
  marketName: string;
  priority: PrioritySeverity;
  projectedLineGbp: number;
  quotedSharePct: number;
  remainingSharePct: number;
  signedLineGbp: number;
  signedSharePct: number;
  status: PlacementStatus;
  targetLineGbp: number;
  targetSharePct: number;
}

export interface PriorityFlag {
  code: "stale_follow_up" | "capacity_gap" | "shrinking_capacity" | "declined_line" | "lead_dependency" | "line_mismatch";
  detail: string;
  marketName?: string;
  severity: PrioritySeverity;
  title: string;
}

export interface PlacementCommentary {
  actions: string[];
  executiveSummary: string;
  observations: string[];
}

export interface PlacementInsight {
  commentary: PlacementCommentary;
  marketProgression: MarketProgress[];
  priorityFlags: PriorityFlag[];
  queryHits: string[];
  statusLanes: StatusLane[];
  summary: PlacementSummary;
}

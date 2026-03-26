export interface StakeholderCommsInput {
  sourceLabel?: string;
  commsText: string;
  prompt?: string;
}

export type CommsStatus = "ready" | "needs-review" | "blocked";

export interface StakeholderCommsInsight {
  summary: {
    completenessPct: number;
    confidence: "high" | "medium" | "low";
    status: CommsStatus;
    audience: string;
    commsType: string;
  };
  fields: Array<{ field: string; value: string; status: "extracted" | "missing" }>;
  keyMessages: string[];
  actions: string[];
  draft: string;
  promptHits: string[];
  warnings: string[];
}

export interface StakeholderCommsPersisted {
  sourceLabel: string;
  commsType: string;
  audience: string;
  tone: string;
  subject: string;
  status: CommsStatus;
  completenessPct: number;
  confidence: string;
  keyMessages: string[];
  actions: string[];
  draft: string;
  promptHits: string[];
  warnings: string[];
}

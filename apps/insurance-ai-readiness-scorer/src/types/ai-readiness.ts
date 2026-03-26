export interface AiReadinessInput {
  sourceLabel?: string;
  assessmentText: string;
  prompt?: string;
}

export type ReadinessStatus = "ready" | "needs-review" | "blocked";

export interface AiReadinessInsight {
  summary: {
    completenessPct: number;
    confidence: "high" | "medium" | "low";
    status: ReadinessStatus;
    readinessScore: number;
    readinessBand: "Foundational" | "Scaling" | "Transforming";
  };
  fields: Array<{ field: string; value: string; status: "extracted" | "missing" }>;
  strengths: string[];
  blockers: string[];
  ninetyDayPlan: string[];
  promptHits: string[];
  warnings: string[];
}


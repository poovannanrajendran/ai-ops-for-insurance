export interface PortfolioShowcaseInput {
  sourceLabel?: string;
  showcaseText: string;
  prompt?: string;
}

export type ShowcaseStatus = "ready" | "needs-review" | "blocked";

export interface PortfolioShowcaseInsight {
  summary: {
    completenessPct: number;
    confidence: "high" | "medium" | "low";
    status: ShowcaseStatus;
    showcaseScore: number;
    showcaseBand: "Foundation" | "Momentum" | "Portfolio-Ready";
  };
  fields: Array<{ field: string; value: string; status: "extracted" | "missing" }>;
  strengths: string[];
  blockers: string[];
  nextActions: string[];
  promptHits: string[];
  warnings: string[];
}

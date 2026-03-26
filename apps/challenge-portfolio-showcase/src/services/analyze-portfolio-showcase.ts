import type { PortfolioShowcaseInput, PortfolioShowcaseInsight } from "@/types/portfolio-showcase";

const REQUIRED_FIELDS = [
  "challenge_name",
  "apps_completed",
  "domain_coverage",
  "outcomes",
  "deployment_status",
  "evidence_links",
  "next_focus",
  "story_hook"
] as const;

type ParsedMap = Record<string, string>;

function parseInput(text: string): ParsedMap {
  const parsed: ParsedMap = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) parsed[key] = value;
  }
  return parsed;
}

function confidence(completeness: number): "high" | "medium" | "low" {
  if (completeness >= 90) return "high";
  if (completeness >= 70) return "medium";
  return "low";
}

function status(completeness: number, warnings: string[]): "ready" | "needs-review" | "blocked" {
  if (completeness < 65) return "blocked";
  if (warnings.length > 0) return "needs-review";
  return "ready";
}

function showcaseBand(score: number): "Foundation" | "Momentum" | "Portfolio-Ready" {
  if (score >= 80) return "Portfolio-Ready";
  if (score >= 55) return "Momentum";
  return "Foundation";
}

export function analyzePortfolioShowcase(input: PortfolioShowcaseInput): {
  analysis: PortfolioShowcaseInsight;
  persisted: Record<string, unknown>;
} {
  const parsed = parseInput(input.showcaseText);

  const fields = REQUIRED_FIELDS.map((field) => {
    const value = parsed[field] ?? "";
    return {
      field,
      value: value || "-",
      status: value ? "extracted" : "missing"
    } as const;
  });

  const extracted = fields.filter((field) => field.status === "extracted").length;
  const completenessPct = Math.round((extracted / REQUIRED_FIELDS.length) * 100);

  const strengths = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("strength_") && value)
    .map(([, value]) => value)
    .slice(0, 6);

  const blockers = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("blocker_") && value)
    .map(([, value]) => value)
    .slice(0, 6);

  const nextActions = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("next_") && value)
    .map(([, value]) => value)
    .slice(0, 6);

  const warnings: string[] = [];
  if (blockers.length >= 3) warnings.push("Multiple blockers remain before portfolio publication.");
  if ((parsed.evidence_links || "").toLowerCase().includes("tbd")) warnings.push("Evidence links are incomplete or marked TBD.");
  if ((parsed.deployment_status || "").toLowerCase().includes("partial")) warnings.push("Deployment coverage is partial; include a rollout status note.");

  const scoreBase = Math.round((completenessPct * 0.65) + Math.max(0, 25 - blockers.length * 7) + Math.min(10, strengths.length * 2));
  const showcaseScore = Math.min(100, Math.max(0, scoreBase));
  const band = showcaseBand(showcaseScore);
  const conf = confidence(completenessPct);
  const state = status(completenessPct, warnings);

  const promptTokens = (input.prompt || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  const corpus = [parsed.domain_coverage, parsed.outcomes, ...strengths, ...blockers, ...nextActions]
    .join(" ")
    .toLowerCase();
  const promptHits = Array.from(new Set(promptTokens.filter((token) => corpus.includes(token)))).slice(0, 8);

  const analysis: PortfolioShowcaseInsight = {
    summary: {
      completenessPct,
      confidence: conf,
      status: state,
      showcaseScore,
      showcaseBand: band
    },
    fields,
    strengths,
    blockers,
    nextActions,
    promptHits,
    warnings
  };

  return {
    analysis,
    persisted: {
      source_label: input.sourceLabel || "manual-entry.txt",
      showcase_text: input.showcaseText,
      showcase_score: showcaseScore,
      showcase_band: band,
      status: state,
      completeness_pct: completenessPct,
      confidence: conf,
      strengths,
      blockers,
      next_actions: nextActions,
      prompt_hits: promptHits,
      warnings,
      raw_analysis: analysis
    }
  };
}

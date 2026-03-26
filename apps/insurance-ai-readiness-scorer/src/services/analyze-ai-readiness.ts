import type { AiReadinessInput, AiReadinessInsight } from "@/types/ai-readiness";

const REQUIRED_FIELDS = [
  "sponsor",
  "target_domains",
  "data_foundation",
  "governance",
  "operating_model",
  "tooling",
  "skills",
  "use_case_1"
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

function readinessBand(score: number): "Foundational" | "Scaling" | "Transforming" {
  if (score >= 75) return "Transforming";
  if (score >= 50) return "Scaling";
  return "Foundational";
}

export function analyzeAiReadiness(input: AiReadinessInput): {
  analysis: AiReadinessInsight;
  persisted: Record<string, unknown>;
} {
  const parsed = parseInput(input.assessmentText);

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
    .slice(0, 5);

  const blockers = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("blocker_") && value)
    .map(([, value]) => value)
    .slice(0, 5);

  const ninetyDayPlan = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("plan_") && value)
    .map(([, value]) => value)
    .slice(0, 6);

  const warnings: string[] = [];
  if (blockers.length >= 3) warnings.push("Multiple blockers identified; staged rollout and executive governance required.");
  if ((parsed.governance || "").toLowerCase().includes("none")) warnings.push("Governance definition is missing or immature.");
  if ((parsed.data_foundation || "").toLowerCase().includes("manual")) warnings.push("Data foundation is predominantly manual and may slow scaling.");

  const scoreBase = Math.round((completenessPct * 0.6) + (Math.max(0, 30 - blockers.length * 8)) + Math.min(10, strengths.length * 2));
  const readinessScore = Math.min(100, Math.max(0, scoreBase));
  const band = readinessBand(readinessScore);
  const conf = confidence(completenessPct);
  const state = status(completenessPct, warnings);

  const promptTokens = (input.prompt || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  const corpus = [parsed.target_domains, parsed.data_foundation, ...strengths, ...blockers, ...ninetyDayPlan]
    .join(" ")
    .toLowerCase();
  const promptHits = Array.from(new Set(promptTokens.filter((token) => corpus.includes(token)))).slice(0, 8);

  const analysis: AiReadinessInsight = {
    summary: {
      completenessPct,
      confidence: conf,
      status: state,
      readinessScore,
      readinessBand: band
    },
    fields,
    strengths,
    blockers,
    ninetyDayPlan,
    promptHits,
    warnings
  };

  return {
    analysis,
    persisted: {
      source_label: input.sourceLabel || "manual-entry.txt",
      assessment_text: input.assessmentText,
      readiness_score: readinessScore,
      readiness_band: band,
      status: state,
      completeness_pct: completenessPct,
      confidence: conf,
      strengths,
      blockers,
      ninety_day_plan: ninetyDayPlan,
      prompt_hits: promptHits,
      warnings,
      raw_analysis: analysis
    }
  };
}


import type {
  SanctionsMatch,
  SanctionsScreeningInsight,
  Severity
} from "@/types/sanctions-screening";

const REQUIRED_FIELDS = [
  "insured_entity",
  "beneficial_owner",
  "broker",
  "territory",
  "counterparty"
] as const;

const WATCHLIST = [
  { listName: "UK HMT Sanctions", entity: "Almazov Industrial Group", risk: "high" as Severity },
  { listName: "EU Restrictive Measures", entity: "TransEastern Commodities FZE", risk: "high" as Severity },
  { listName: "OFAC SDN", entity: "Baltic Export Trading JSC", risk: "medium" as Severity },
  { listName: "UK HMT Sanctions", entity: "Orion Placement LLC", risk: "medium" as Severity },
  { listName: "EU Restrictive Measures", entity: "Harborline Logistics GmbH", risk: "low" as Severity }
];

function parsePairs(input: string) {
  const pairs = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim().toLowerCase(), rest.join("=").trim()] as const;
    });
  return new Map<string, string>(pairs);
}

function normalizedTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function similarity(a: string, b: string): number {
  const aTokens = new Set(normalizedTokens(a));
  const bTokens = new Set(normalizedTokens(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return Number(((intersection / union) * 100).toFixed(1));
}

function screeningStateFrom(matches: SanctionsMatch[]) {
  if (matches.some((m) => m.severity === "high" && m.similarityScore >= 50)) return "block" as const;
  if (matches.some((m) => m.severity === "medium" && m.similarityScore >= 35)) return "review" as const;
  return "clear" as const;
}

export function analyzeSanctionsScreening(screeningText: string, question?: string) {
  const map = parsePairs(screeningText);
  const missing = REQUIRED_FIELDS.filter((field) => !map.get(field));

  if (missing.length > 0) {
    const insight: SanctionsScreeningInsight = {
      summary: {
        entitiesScreened: 0,
        highRiskMatches: 0,
        mediumRiskMatches: 0,
        lowRiskMatches: 0,
        screeningState: "block"
      },
      matches: [],
      recommendedActions: [],
      briefingNarrative: [],
      queryHits: [],
      warnings: [`Missing required screening fields: ${missing.join(", ")}.`],
      whitespaceRows: REQUIRED_FIELDS.map((field) => ({
        fieldWording: field,
        extractedValue: map.get(field) ?? "",
        status: map.get(field) ? "EXTRACTED" : "MISSING"
      }))
    };
    return { missing, insight };
  }

  const entities = REQUIRED_FIELDS.map((field) => map.get(field) ?? "");
  const matches: SanctionsMatch[] = [];

  for (const inputEntity of entities) {
    for (const watch of WATCHLIST) {
      const score = similarity(inputEntity, watch.entity);
      if (score >= 28) {
        matches.push({
          listName: watch.listName,
          matchedEntity: watch.entity,
          inputEntity,
          similarityScore: score,
          severity: watch.risk,
          rationale: `${watch.listName} token overlap ${score}% with input entity.`
        });
      }
    }
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);
  const highRiskMatches = matches.filter((m) => m.severity === "high").length;
  const mediumRiskMatches = matches.filter((m) => m.severity === "medium").length;
  const lowRiskMatches = matches.filter((m) => m.severity === "low").length;
  const screeningState = screeningStateFrom(matches);

  const recommendedActions = [
    screeningState === "block"
      ? "Pause transaction and escalate to compliance for enhanced due diligence."
      : null,
    screeningState === "review"
      ? "Route to sanctions officer for documentary verification and ownership trace."
      : null,
    screeningState === "clear"
      ? "Proceed with standard sanctions attestation and retain screening evidence."
      : null
  ].filter(Boolean) as string[];

  const briefingNarrative = [
    `${entities.length} entities were screened against deterministic sanctions watchlists.`,
    `${highRiskMatches} high-risk, ${mediumRiskMatches} medium-risk, and ${lowRiskMatches} low-risk proximity matches were found.`,
    screeningState === "block"
      ? "Screening state is BLOCK: one or more high-proximity sanctions matches require immediate hold."
      : screeningState === "review"
        ? "Screening state is REVIEW: compliance validation required prior to bind."
        : "Screening state is CLEAR: no blocking proximity indicators detected."
  ];

  const warnings = [
    screeningState === "block" ? "Block-level sanctions proximity detected." : null,
    matches.length >= 3 ? "Multiple list overlaps found; strengthen ownership verification." : null
  ].filter(Boolean) as string[];

  const tokens = (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  const queryHits =
    tokens.length === 0
      ? []
      : matches
          .filter((m) =>
            tokens.some((token) =>
              `${m.matchedEntity} ${m.listName} ${m.rationale}`.toLowerCase().includes(token)
            )
          )
          .slice(0, 5)
          .map((m) => `${m.listName}: ${m.inputEntity} vs ${m.matchedEntity} (${m.similarityScore}%)`);

  const insight: SanctionsScreeningInsight = {
    summary: {
      entitiesScreened: entities.length,
      highRiskMatches,
      mediumRiskMatches,
      lowRiskMatches,
      screeningState
    },
    matches,
    recommendedActions,
    briefingNarrative,
    queryHits,
    warnings,
    whitespaceRows: REQUIRED_FIELDS.map((field) => ({
      fieldWording: field,
      extractedValue: map.get(field) ?? "",
      status: map.get(field) ? "EXTRACTED" : "MISSING"
    }))
  };

  return { missing: [] as string[], insight };
}

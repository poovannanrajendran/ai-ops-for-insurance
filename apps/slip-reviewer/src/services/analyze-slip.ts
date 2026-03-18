import type {
  ClauseFlag,
  GapFlag,
  QueryHit,
  SlipFieldMatch,
  SlipReviewCommentary,
  SlipReviewInsight,
  SlipStructuredData
} from "@/types/slip-review";

const fieldOrder = [
  "insured_name",
  "broker",
  "territory",
  "inception_date",
  "expiry_date",
  "limit",
  "currency",
  "deductible",
  "sublimits",
  "governing_law",
  "jurisdiction",
  "claims_notification",
  "key_exclusions",
  "subjectivities"
] as const;

const requiredFields = ["insured_name", "inception_date", "expiry_date", "limit", "currency"] as const;

const sectionTerminators = [
  "risk details",
  "express warranties",
  "choice of law",
  "choice of jurisdiction",
  "premium",
  "payment terms",
  "fiscal",
  "broker remuneration"
];

type FieldKey = (typeof fieldOrder)[number];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter(Boolean);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    const normalized = compact(item);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function splitItems(value: string): string[] {
  const protectedAmounts = value.replace(/(\d),(\d)/g, "$1__COMMA__$2");

  return dedupe(
    protectedAmounts
      .split(/[,;]|\sand\s/gi)
      .map((item) => item.replaceAll("__COMMA__", ","))
      .map((item) => compact(item))
      .filter(Boolean)
  );
}

function findInlineValue(lines: string[], labels: string[]): string | null {
  for (const line of lines) {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matcher = new RegExp(`^${escaped}\\s*[:\u2013\u2014-]\\s*(.+)$`, "i");
      const match = line.match(matcher);
      if (match?.[1]) {
        return compact(match[1]);
      }
    }
  }

  return null;
}

function findDateFromRange(lines: string[], startLabel: string, endLabel: string): string | null {
  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (!normalized.includes(startLabel) || !normalized.includes(endLabel)) {
      continue;
    }

    const parts = line.split(/\bto\b/i);
    if (parts.length < 2) {
      continue;
    }

    const left = compact(parts[0].replace(/^(from|period|inception date)\s*[:-]?/i, ""));
    const right = compact(parts[1].replace(/^(to|expiry date|expiration date)\s*[:-]?/i, ""));

    return startLabel === "from" ? left : right;
  }

  return null;
}

function extractSectionItems(lines: string[], headers: string[]): string[] {
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  const collected: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const normalized = line.toLowerCase();
    const isHeader = lowerHeaders.some((header) => normalized.startsWith(header));

    if (isHeader) {
      inSection = true;
      const inline = compact(line.replace(/^[^:]+:/, ""));
      if (inline && inline.toLowerCase() !== "none") {
        collected.push(...splitItems(inline));
      }
      continue;
    }

    if (
      inSection &&
      (normalized.endsWith(":") || sectionTerminators.some((header) => normalized.startsWith(header)))
    ) {
      inSection = false;
      continue;
    }

    if (!inSection) {
      continue;
    }

    const value = compact(line.replace(/^[-*•]\s*/, ""));
    if (!value || value.toLowerCase() === "none") {
      continue;
    }

    collected.push(...splitItems(value));
  }

  return dedupe(collected);
}

function inferCurrency(rawText: string, inlineCurrency: string | null): string | null {
  if (inlineCurrency) {
    const normalized = inlineCurrency.toUpperCase();
    if (normalized === "£") return "GBP";
    if (normalized === "$") return "USD";
    if (normalized === "€") return "EUR";
    return normalized;
  }

  const upper = rawText.toUpperCase();
  if (/\bGBP\b|£/.test(upper)) return "GBP";
  if (/\bUSD\b|\$/.test(upper)) return "USD";
  if (/\bEUR\b|€/.test(upper)) return "EUR";
  return null;
}

function extractStructuredData(rawText: string): SlipStructuredData {
  const lines = normalizeLines(rawText);

  const insuredName = findInlineValue(lines, ["insured name", "insured", "assured", "policyholder"]);
  const broker = findInlineValue(lines, ["broker", "placing broker"]);
  const territory =
    findInlineValue(lines, ["territory", "territorial limits", "situation", "geography"]) ??
    findInlineValue(lines, ["territories"]);

  const inceptionDate =
    findInlineValue(lines, ["inception date", "effective date", "from"]) ??
    findDateFromRange(lines, "from", "to");

  const expiryDate =
    findInlineValue(lines, ["expiry date", "expiration date", "to"]) ??
    findDateFromRange(lines, "to", "from");

  const limit = findInlineValue(lines, [
    "limit of liability",
    "policy aggregate limit",
    "sum insured",
    "sum (re)insured",
    "limit"
  ]);

  const deductible = findInlineValue(lines, ["retention", "deductible", "excess"]);

  const governingLaw =
    findInlineValue(lines, ["governing law", "choice of law"]) ??
    lines.find((line) => /governed by.*law/i.test(line)) ??
    null;

  const jurisdiction = findInlineValue(lines, ["choice of jurisdiction", "jurisdiction"]);

  const claimsNotification =
    findInlineValue(lines, ["notification of claims to", "claims notification", "notice of claims to"]) ??
    null;

  const keyExclusions = extractSectionItems(lines, [
    "exclusions",
    "key exclusions",
    "exclusion clauses",
    "excluded perils",
    "wording"
  ]).filter((item) => /exclusion|sanction|war|crime|cyber|terror|pollution|nuclear/i.test(item));

  const subjectivities = extractSectionItems(lines, ["subjectivities", "conditions precedent"]);

  const sublimitCandidates = extractSectionItems(lines, ["sublimits", "sub-limits"]);
  const sublimits = dedupe(
    sublimitCandidates.length > 0
      ? sublimitCandidates
      : lines
          .filter((line) => /limited to|sub-?limit|any one claim and in the aggregate/i.test(line))
          .slice(0, 6)
  );

  const currency = inferCurrency(rawText, findInlineValue(lines, ["currency"]));

  return {
    insuredName,
    broker,
    territory,
    inceptionDate,
    expiryDate,
    limit,
    currency,
    deductible,
    sublimits,
    governingLaw,
    jurisdiction,
    claimsNotification,
    keyExclusions: dedupe(keyExclusions),
    subjectivities
  };
}

function fieldValue(structured: SlipStructuredData, fieldName: FieldKey): string | null {
  switch (fieldName) {
    case "insured_name":
      return structured.insuredName;
    case "broker":
      return structured.broker;
    case "territory":
      return structured.territory;
    case "inception_date":
      return structured.inceptionDate;
    case "expiry_date":
      return structured.expiryDate;
    case "limit":
      return structured.limit;
    case "currency":
      return structured.currency;
    case "deductible":
      return structured.deductible;
    case "sublimits":
      return structured.sublimits.join("; ") || null;
    case "governing_law":
      return structured.governingLaw;
    case "jurisdiction":
      return structured.jurisdiction;
    case "claims_notification":
      return structured.claimsNotification;
    case "key_exclusions":
      return structured.keyExclusions.join("; ") || null;
    case "subjectivities":
      return structured.subjectivities.join("; ") || null;
    default:
      return null;
  }
}

function buildFieldMatches(structured: SlipStructuredData): SlipFieldMatch[] {
  return fieldOrder.map((fieldName) => {
    const extractedValue = fieldValue(structured, fieldName);
    return {
      fieldName,
      extractedValue,
      status: extractedValue ? "matched" : "missing"
    };
  });
}

function buildUnusualClauses(rawText: string, structured: SlipStructuredData): ClauseFlag[] {
  const normalized = rawText.toLowerCase();
  const clauses: ClauseFlag[] = [];

  if (/war and cyber operation exclusion|lma5567/i.test(rawText)) {
    clauses.push({
      severity: "high",
      clause: "War and cyber operation exclusion detected",
      rationale: "War/cyber operation carve-outs can materially narrow cyber coverage outcomes."
    });
  }

  if (/sanction limitation|sanction.*exclusion|lma3100/i.test(rawText)) {
    clauses.push({
      severity: "medium",
      clause: "Sanctions limitation wording present",
      rationale: "Sanctions wording can prevent payment or defence support in restricted jurisdictions."
    });
  }

  if (/claims made basis/i.test(rawText) && !/retroactive date/i.test(rawText)) {
    clauses.push({
      severity: "high",
      clause: "Claims-made basis without explicit retroactive date",
      rationale: "Missing retroactive date may create uncertainty around prior acts coverage."
    });
  }

  if (/premium payment clause\s*[–-]?\s*60\s*days/i.test(normalized)) {
    clauses.push({
      severity: "medium",
      clause: "Strict premium payment clause",
      rationale: "Short premium payment windows can trigger cancellation risk if operationally missed."
    });
  }

  if ((structured.subjectivities.length === 0 || structured.subjectivities.some((x) => /none/i.test(x))) &&
      /subjectivities\s*:\s*none/i.test(normalized)) {
    clauses.push({
      severity: "medium",
      clause: "No subjectivities recorded",
      rationale: "Absence of subjectivities may be acceptable but removes pre-bind control checkpoints."
    });
  }

  return clauses;
}

function buildCoverageGaps(
  structured: SlipStructuredData,
  matches: SlipFieldMatch[],
  missingRequiredFields: string[]
): GapFlag[] {
  const gaps: GapFlag[] = [];

  if (missingRequiredFields.length > 0) {
    gaps.push({
      severity: "high",
      gap: `Required fields missing: ${missingRequiredFields.join(", ")}`,
      rationale: "The minimum review gate failed and requires completion before relying on this slip summary."
    });
  }

  if (!structured.claimsNotification) {
    gaps.push({
      severity: "medium",
      gap: "Claims notification details missing",
      rationale: "No clear claim notice path was extracted; this creates operational uncertainty at FNOL."
    });
  }

  if (structured.keyExclusions.length === 0) {
    gaps.push({
      severity: "medium",
      gap: "No explicit exclusions extracted",
      rationale: "The slip text did not surface exclusion wording for quick review."
    });
  }

  const matchedCount = matches.filter((item) => item.status === "matched").length;
  if (matchedCount <= 6) {
    gaps.push({
      severity: "medium",
      gap: "Low overall extraction coverage",
      rationale: "Field coverage is limited; validate OCR quality or provide the full signed slip text."
    });
  }

  return gaps;
}

function buildCommentary(
  structured: SlipStructuredData,
  fieldCoverage: number,
  unusualClauses: ClauseFlag[],
  coverageGaps: GapFlag[]
): SlipReviewCommentary {
  const observations = [
    structured.insuredName
      ? `Insured captured as ${structured.insuredName}.`
      : "Insured name could not be extracted.",
    structured.limit
      ? `Limit extracted as ${structured.limit}${structured.currency ? ` (${structured.currency})` : ""}.`
      : "No limit was extracted from the provided text.",
    structured.territory
      ? `Territory scope extracted as ${structured.territory}.`
      : "Territorial scope was not identified."
  ];

  const actions = [
    ...coverageGaps.map((gap) => `Address coverage gap: ${gap.gap}`),
    ...unusualClauses.map((flag) => `Review clause: ${flag.clause}`)
  ];

  return {
    executiveSummary: `${fieldCoverage}% of Day 4 slip fields were extracted. ${unusualClauses.length} unusual clause flag(s) and ${coverageGaps.length} coverage gap flag(s) were generated.`,
    observations,
    actions: actions.length > 0 ? actions : ["No blocker flags detected. Proceed to reviewer sign-off."]
  };
}

function buildQueryHits(question: string | null, matches: SlipFieldMatch[]): QueryHit[] {
  if (!question || !question.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  if (tokens.length === 0) {
    return [];
  }

  return matches
    .filter((match) => match.extractedValue)
    .filter((match) => {
      const haystack = `${match.fieldName} ${match.extractedValue}`.toLowerCase();
      return tokens.some((token) => haystack.includes(token));
    })
    .slice(0, 8)
    .map((match) => ({
      fieldName: match.fieldName,
      snippet: match.extractedValue as string
    }));
}

export function buildSlipReviewInsight(statementText: string, question?: string | null): SlipReviewInsight {
  const structuredData = extractStructuredData(statementText);
  const fieldMatches = buildFieldMatches(structuredData);
  const matchedFields = fieldMatches.filter((field) => field.status === "matched").length;
  const missingRequiredFields = requiredFields.filter((requiredField) => {
    const found = fieldMatches.find((field) => field.fieldName === requiredField);
    return !found || found.status === "missing";
  });

  const unusualClauses = buildUnusualClauses(statementText, structuredData);
  const coverageGaps = buildCoverageGaps(structuredData, fieldMatches, missingRequiredFields);
  const fieldCoverage = Math.round((matchedFields / fieldMatches.length) * 100);

  return {
    structuredData,
    fieldMatches,
    unusualClauses,
    coverageGaps,
    commentary: buildCommentary(structuredData, fieldCoverage, unusualClauses, coverageGaps),
    summary: {
      fieldCoverage,
      matchedFields,
      missingFields: fieldMatches.length - matchedFields,
      gatePassed: missingRequiredFields.length === 0,
      missingRequiredFields
    },
    query: {
      question: question ?? null,
      hits: buildQueryHits(question ?? null, fieldMatches)
    }
  };
}

import type {
  AppetiteWarning,
  QueryHit,
  RiskAppetiteCommentary,
  RiskAppetiteInsight,
  RiskAppetiteStructuredData,
  WhitespaceFieldMatch
} from "@/types/risk-appetite";

const whitespaceFieldOrder = [
  "insured_name",
  "class_of_business",
  "territory",
  "max_line_size",
  "currency",
  "minimum_premium",
  "inception_date",
  "expiry_date",
  "excluded_risks",
  "subjectivities",
  "referral_triggers"
] as const;

const minimumRequiredFields = ["class_of_business", "territory", "max_line_size"] as const;

type FieldKey = (typeof whitespaceFieldOrder)[number];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter(Boolean);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => {
      if (/^[A-Z0-9]{2,6}$/.test(segment)) {
        return segment;
      }

      const lower = segment.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function splitItems(value: string): string[] {
  const amountProtected = value.replace(/(\d),(\d)/g, "$1__COMMA__$2");

  return amountProtected
    .split(/[,;/]| and /gi)
    .map((item) => item.replaceAll("__COMMA__", ","))
    .map((item) => compact(item))
    .filter(Boolean)
    .map((item) => titleCase(item));
}

function findInlineValue(lines: string[], labels: string[]): string | null {
  for (const line of lines) {
    for (const label of labels) {
      const matcher = new RegExp(`^${label}\\s*[:\\-]\\s*(.+)$`, "i");
      const match = line.match(matcher);
      if (match?.[1]) {
        return compact(match[1]);
      }
    }
  }

  return null;
}

function extractSectionItems(lines: string[], headers: string[]): string[] {
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  const collected: string[] = [];
  let currentSection = false;

  for (const line of lines) {
    const normalizedLine = line.toLowerCase();
    const looksLikeHeader = normalizedLine.endsWith(":");
    const isTargetHeader = lowerHeaders.some((header) =>
      normalizedLine.startsWith(header)
    );

    if (isTargetHeader) {
      currentSection = true;
      const inlineRemainder = compact(line.replace(/^[^:]+:/, ""));
      if (inlineRemainder.length > 0) {
        collected.push(...splitItems(inlineRemainder));
      }
      continue;
    }

    if (looksLikeHeader) {
      currentSection = false;
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const value = compact(line.replace(/^[-*•]\s*/, ""));
    if (value.length > 0) {
      collected.push(...splitItems(value));
    }
  }

  return [...new Set(collected)];
}

function normalizeCurrency(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed === "£") return "GBP";
  if (trimmed === "$") return "USD";
  if (trimmed === "€") return "EUR";

  return trimmed.toUpperCase();
}

function extractStructuredData(rawText: string): RiskAppetiteStructuredData {
  const lines = normalizeLines(rawText);

  const insuredName = findInlineValue(lines, [
    "insured name",
    "insured",
    "assured",
    "policyholder"
  ]);

  const classInline = findInlineValue(lines, [
    "class of business",
    "classes of business",
    "target classes",
    "classes"
  ]);
  const territoryInline = findInlineValue(lines, [
    "territory",
    "territories",
    "geography",
    "regions"
  ]);

  const maxLineSize = findInlineValue(lines, [
    "max line size",
    "maximum line size",
    "line size cap",
    "line size"
  ]);
  const currencyInline = findInlineValue(lines, [
    "currency",
    "denomination",
    "settlement currency"
  ]);
  const minimumPremium = findInlineValue(lines, ["minimum premium", "min premium"]);
  const inceptionDate = findInlineValue(lines, ["inception date", "effective date"]);
  const expiryDate = findInlineValue(lines, ["expiry date", "expiration date", "renewal date"]);

  const excludedRisks = extractSectionItems(lines, ["exclusions", "excluded risks", "out of appetite"]);
  const subjectivities = extractSectionItems(lines, ["subjectivities", "conditions precedent"]);
  const referralTriggers = extractSectionItems(lines, ["referrals", "referral triggers"]);
  const conditions = extractSectionItems(lines, ["conditions", "underwriting conditions"]);

  return {
    insuredName,
    classOfBusiness: classInline ? splitItems(classInline) : [],
    territory: territoryInline ? splitItems(territoryInline) : [],
    maxLineSize,
    currency: normalizeCurrency(currencyInline),
    minimumPremium,
    inceptionDate,
    expiryDate,
    excludedRisks,
    subjectivities,
    referralTriggers,
    conditions
  };
}

function fieldValue(structuredData: RiskAppetiteStructuredData, fieldName: FieldKey): string | null {
  switch (fieldName) {
    case "insured_name":
      return structuredData.insuredName;
    case "class_of_business":
      return structuredData.classOfBusiness.join(", ") || null;
    case "territory":
      return structuredData.territory.join(", ") || null;
    case "max_line_size":
      return structuredData.maxLineSize;
    case "currency":
      return structuredData.currency;
    case "minimum_premium":
      return structuredData.minimumPremium;
    case "inception_date":
      return structuredData.inceptionDate;
    case "expiry_date":
      return structuredData.expiryDate;
    case "excluded_risks":
      return structuredData.excludedRisks.join(", ") || null;
    case "subjectivities":
      return structuredData.subjectivities.join(", ") || null;
    case "referral_triggers":
      return structuredData.referralTriggers.join(", ") || null;
    default:
      return null;
  }
}

function buildWhitespaceFieldMatches(
  structuredData: RiskAppetiteStructuredData
): WhitespaceFieldMatch[] {
  return whitespaceFieldOrder.map((fieldName) => {
    const extractedValue = fieldValue(structuredData, fieldName);
    return {
      fieldName,
      extractedValue,
      status: extractedValue ? "matched" : "missing"
    };
  });
}

function buildWarnings(
  structuredData: RiskAppetiteStructuredData,
  whitespaceFields: WhitespaceFieldMatch[]
): AppetiteWarning[] {
  const warnings: AppetiteWarning[] = [];
  const missingRequired = whitespaceFields.filter(
    (field) =>
      minimumRequiredFields.includes(field.fieldName as (typeof minimumRequiredFields)[number]) &&
      field.status === "missing"
  );

  if (missingRequired.length > 0) {
    warnings.push({
      severity: "high",
      message: `Missing required data: ${missingRequired.map((field) => field.fieldName).join(", ")}.`
    });
  }

  if (!structuredData.currency) {
    warnings.push({
      severity: "medium",
      message: "Currency not detected. Add policy currency for limit interpretation."
    });
  }

  if (structuredData.excludedRisks.length === 0) {
    warnings.push({
      severity: "medium",
      message: "No exclusions detected. Include explicit out-of-appetite items."
    });
  }

  return warnings;
}

function buildCommentary(
  structuredData: RiskAppetiteStructuredData,
  warnings: AppetiteWarning[],
  whitespaceFields: WhitespaceFieldMatch[]
): RiskAppetiteCommentary {
  const matchedFields = whitespaceFields.filter((field) => field.status === "matched").length;
  const coverage = Math.round((matchedFields / whitespaceFields.length) * 100);

  const executiveSummary = `${coverage}% of standard whitespace fields were extracted from the submitted appetite statement.`;

  const observations = [
    structuredData.classOfBusiness.length > 0
      ? `Class appetite includes ${structuredData.classOfBusiness.join(", ")}.`
      : "Class appetite is not explicit in the current text.",
    structuredData.territory.length > 0
      ? `Territory appetite includes ${structuredData.territory.join(", ")}.`
      : "Territory scope is not explicit in the current text.",
    structuredData.maxLineSize
      ? `Maximum line size captured as ${structuredData.maxLineSize}.`
      : "Maximum line size is missing from the extracted output."
  ];

  const actions =
    warnings.length > 0
      ? warnings.map((warning) => `Resolve ${warning.severity} warning: ${warning.message}`)
      : [
          "No extraction blockers detected.",
          "Proceed with reviewer validation and downstream system mapping."
        ];

  return {
    executiveSummary,
    observations,
    actions
  };
}

function buildQueryHits(question: string | null, whitespaceFields: WhitespaceFieldMatch[]): QueryHit[] {
  if (!question || question.trim().length === 0) {
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

  const hits = whitespaceFields
    .filter((field) => field.extractedValue)
    .filter((field) => {
      const haystack = `${field.fieldName} ${field.extractedValue}`.toLowerCase();
      return tokens.some((token) => haystack.includes(token));
    })
    .slice(0, 6)
    .map((field) => ({
      fieldName: field.fieldName,
      snippet: field.extractedValue as string
    }));

  return hits;
}

export function buildRiskAppetiteInsight(
  statementText: string,
  question?: string | null
): RiskAppetiteInsight {
  const structuredData = extractStructuredData(statementText);
  const whitespaceFields = buildWhitespaceFieldMatches(structuredData);
  const warnings = buildWarnings(structuredData, whitespaceFields);
  const commentary = buildCommentary(structuredData, warnings, whitespaceFields);
  const queryHits = buildQueryHits(question ?? null, whitespaceFields);
  const matchedFields = whitespaceFields.filter((field) => field.status === "matched").length;

  return {
    structuredData,
    whitespaceFields,
    warnings,
    commentary,
    summary: {
      fieldCoverage: Math.round((matchedFields / whitespaceFields.length) * 100),
      matchedFields,
      missingFields: whitespaceFields.length - matchedFields
    },
    query: {
      question: question ?? null,
      hits: queryHits
    }
  };
}

import type {
  ConcentrationWarning,
  DistributionBucket,
  PortfolioAnalysis,
  PortfolioCommentary,
  PortfolioInsight,
  PortfolioRecord
} from "@/types/portfolio";

const headerAliases: Record<string, string[]> = {
  accountName: ["account_name", "account name", "account", "insured_name", "insured name"],
  classOfBusiness: [
    "class_of_business",
    "class of business",
    "class",
    "lob",
    "line_of_business",
    "line of business"
  ],
  territory: ["territory", "region", "country", "location"],
  limitAmount: ["limit_amount", "limit amount", "limit", "line_size", "line size", "tiv"],
  currency: ["currency", "ccy"]
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function titleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeClassOfBusiness(value: string): string {
  const lowered = value.trim().toLowerCase();

  if (lowered === "marine" || lowered === "marine cargo" || lowered === "cargo") {
    return "Marine Cargo";
  }
  if (lowered === "property" || lowered === "commercial property") {
    return "Property";
  }
  if (lowered === "product recall" || lowered === "recall") {
    return "Product Recall";
  }
  if (lowered === "professional indemnity" || lowered === "pi") {
    return "Professional Indemnity";
  }
  if (lowered === "cyber") {
    return "Cyber";
  }

  return titleCase(value);
}

function normalizeTerritory(value: string): string {
  const lowered = value.trim().toLowerCase();

  if (["uk", "u.k.", "united kingdom", "great britain"].includes(lowered)) {
    return "United Kingdom";
  }
  if (["us", "u.s.", "usa", "united states", "united states of america"].includes(lowered)) {
    return "United States";
  }
  if (["eu", "europe", "european union"].includes(lowered)) {
    return "Europe";
  }
  if (["global", "worldwide"].includes(lowered)) {
    return "Global";
  }

  return titleCase(value);
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

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentValue.trim());
      currentValue = "";

      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentValue += character;
  }

  if (inQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue.trim());

    if (currentRow.some((value) => value.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function resolveHeaderIndex(headers: string[], aliases: string[]): number {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
}

function parseLimitAmount(rawLimit: string, rawCurrency: string | null): {
  amount: number;
  currency: string | null;
} {
  const trimmed = rawLimit.trim();

  if (!trimmed) {
    throw new Error("Limit amount is required.");
  }

  const currencyMatch = trimmed.match(/(GBP|USD|EUR|£|\$|€)/i);
  const magnitudeMatch = trimmed.match(/\b(m|mn|million|k|thousand)\b/i);
  const numericToken = trimmed.replace(/[^0-9.]/g, "");
  const baseAmount = Number(numericToken);

  if (!Number.isFinite(baseAmount) || numericToken.length === 0) {
    throw new Error(`Invalid limit amount: "${rawLimit}".`);
  }

  let amount = baseAmount;
  const magnitude = magnitudeMatch?.[1]?.toLowerCase();

  if (magnitude === "m" || magnitude === "mn" || magnitude === "million") {
    amount *= 1_000_000;
  } else if (magnitude === "k" || magnitude === "thousand") {
    amount *= 1_000;
  }

  return {
    amount,
    currency: normalizeCurrency(rawCurrency ?? currencyMatch?.[1] ?? null)
  };
}

function createDistribution(values: string[], total: number): DistributionBucket[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: Number((count / total).toFixed(2))
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label);
    });
}

function limitBand(amount: number): string {
  if (amount <= 1_000_000) {
    return "Up to 1M";
  }
  if (amount <= 5_000_000) {
    return "1M to 5M";
  }
  if (amount <= 10_000_000) {
    return "5M to 10M";
  }

  return "Over 10M";
}

function topBucket(buckets: DistributionBucket[]): DistributionBucket | null {
  return buckets[0] ?? null;
}

export function buildConcentrationWarnings(analysis: PortfolioAnalysis): ConcentrationWarning[] {
  const warnings: ConcentrationWarning[] = [];
  const topClass = topBucket(analysis.summary.classDistribution);
  const topTerritory = topBucket(analysis.summary.territoryDistribution);
  const topLimitBand = topBucket(analysis.summary.limitBandDistribution);

  if (topClass && topClass.share >= 0.55) {
    warnings.push({
      dimension: "class",
      label: topClass.label,
      share: topClass.share,
      severity: topClass.share >= 0.7 ? "high" : "medium",
      message: `${topClass.label} represents ${Math.round(topClass.share * 100)}% of the portfolio.`
    });
  }

  if (topTerritory && topTerritory.share >= 0.55) {
    warnings.push({
      dimension: "territory",
      label: topTerritory.label,
      share: topTerritory.share,
      severity: topTerritory.share >= 0.7 ? "high" : "medium",
      message: `${topTerritory.label} represents ${Math.round(topTerritory.share * 100)}% of the portfolio.`
    });
  }

  if (topLimitBand && topLimitBand.label === "Over 10M" && topLimitBand.share >= 0.3) {
    warnings.push({
      dimension: "limitBand",
      label: topLimitBand.label,
      share: topLimitBand.share,
      severity: topLimitBand.share >= 0.5 ? "high" : "medium",
      message: `Large limits above 10M make up ${Math.round(topLimitBand.share * 100)}% of the portfolio.`
    });
  }

  return warnings;
}

export function buildPortfolioCommentary(
  analysis: PortfolioAnalysis,
  warnings: ConcentrationWarning[]
): PortfolioCommentary {
  const topClass = topBucket(analysis.summary.classDistribution);
  const topTerritory = topBucket(analysis.summary.territoryDistribution);
  const topLimitBand = topBucket(analysis.summary.limitBandDistribution);

  const executiveSummary = [
    `${analysis.summary.totalRecords} portfolio rows parsed`,
    topClass ? `largest class is ${topClass.label}` : null,
    topTerritory ? `largest territory is ${topTerritory.label}` : null
  ]
    .filter(Boolean)
    .join(", ")
    .concat(".");

  const observations = [
    topClass
      ? `${topClass.label} accounts for ${Math.round(topClass.share * 100)}% of the class mix.`
      : "Class mix is unavailable.",
    topTerritory
      ? `${topTerritory.label} accounts for ${Math.round(topTerritory.share * 100)}% of the territory mix.`
      : "Territory mix is unavailable.",
    topLimitBand
      ? `${topLimitBand.label} is the largest limit band at ${Math.round(topLimitBand.share * 100)}% of rows.`
      : "Limit band mix is unavailable."
  ];

  const actions =
    warnings.length > 0
      ? warnings.map((warning) => `Review ${warning.dimension} concentration: ${warning.message}`)
      : [
          "No single concentration trigger exceeded the current warning thresholds.",
          "Proceed to commentary review and underwriting discussion for qualitative context."
        ];

  return {
    executiveSummary,
    observations,
    actions
  };
}

export function parsePortfolioCsv(csvText: string): PortfolioRecord[] {
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const [headerRow, ...dataRows] = rows;
  const classIndex = resolveHeaderIndex(headerRow, headerAliases.classOfBusiness);
  const territoryIndex = resolveHeaderIndex(headerRow, headerAliases.territory);
  const limitIndex = resolveHeaderIndex(headerRow, headerAliases.limitAmount);

  if (classIndex === -1 || territoryIndex === -1 || limitIndex === -1) {
    throw new Error(
      "CSV must include columns for class of business, territory, and limit amount."
    );
  }

  const accountIndex = resolveHeaderIndex(headerRow, headerAliases.accountName);
  const currencyIndex = resolveHeaderIndex(headerRow, headerAliases.currency);

  return dataRows.map((row, rowOffset) => {
    const normalizedRow =
      row.length > headerRow.length && limitIndex === headerRow.length - 1
        ? [
            ...row.slice(0, limitIndex),
            row.slice(limitIndex).join(",")
          ]
        : row;

    if (normalizedRow.length > headerRow.length) {
      throw new Error(`Row ${rowOffset + 2} has more columns than the header row.`);
    }

    const rawClass = normalizedRow[classIndex]?.trim();
    const rawTerritory = normalizedRow[territoryIndex]?.trim();
    const rawLimit = normalizedRow[limitIndex]?.trim();

    if (!rawClass || !rawTerritory || !rawLimit) {
      throw new Error(`Row ${rowOffset + 2} is missing class, territory, or limit data.`);
    }

    const { amount, currency } = parseLimitAmount(rawLimit, normalizedRow[currencyIndex] ?? null);

    return {
      rowNumber: rowOffset + 2,
      accountName: accountIndex === -1 ? null : normalizedRow[accountIndex]?.trim() || null,
      classOfBusiness: normalizeClassOfBusiness(rawClass),
      territory: normalizeTerritory(rawTerritory),
      limitAmount: amount,
      currency
    };
  });
}

export function analyzePortfolio(csvText: string): PortfolioAnalysis {
  const records = parsePortfolioCsv(csvText);
  const totalRecords = records.length;

  return {
    records,
    summary: {
      totalRecords,
      classDistribution: createDistribution(
        records.map((record) => record.classOfBusiness),
        totalRecords
      ),
      territoryDistribution: createDistribution(
        records.map((record) => record.territory),
        totalRecords
      ),
      limitBandDistribution: createDistribution(
        records.map((record) => limitBand(record.limitAmount)),
        totalRecords
      ),
      currencies: [
        ...new Set(
          records
            .map((record) => record.currency)
            .filter((currency): currency is string => currency !== null)
        )
      ].sort()
    }
  };
}

export function buildPortfolioInsight(csvText: string): PortfolioInsight {
  const analysis = analyzePortfolio(csvText);
  const warnings = buildConcentrationWarnings(analysis);
  const commentary = buildPortfolioCommentary(analysis, warnings);

  return {
    ...analysis,
    warnings,
    commentary
  };
}

import type { QueueInsight, QueueSummary, QueueWarning, RankedReferral, ReferralRecord, ScoreFactor } from "@/types/referral-queue";

const requiredHeaders = [
  "referral_id",
  "insured_name",
  "class_of_business",
  "territory",
  "quoted_premium_gbp",
  "tiv_gbp",
  "loss_ratio_pct",
  "days_to_inception",
  "missing_fields_count",
  "new_business",
  "claims_activity",
  "sanctions_flag",
  "referral_reason",
  "broker_tier"
] as const;

const reasonRules = [
  { pattern: /sanctions|screening|embargo/i, points: 18, detail: "Sanctions or screening referral reason present." },
  { pattern: /claims deterioration|loss hit|loss development/i, points: 14, detail: "Claims deterioration or adverse loss development referenced." },
  { pattern: /capacity|aggregate|cat/i, points: 12, detail: "Capacity or aggregate pressure increases referral urgency." },
  { pattern: /bespoke wording|wording change|manuscript/i, points: 10, detail: "Bespoke or changing wording needs senior review." },
  { pattern: /new territory|territorial extension/i, points: 8, detail: "Territorial expansion needs governance review." },
  { pattern: /clarification pending|pending/i, points: 6, detail: "Open clarification items slow referral readiness." }
] as const;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseBoolean(value: string): boolean {
  return /^(true|yes|1)$/i.test(value.trim());
}

function parseNumber(value: string, field: string, rowNumber: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Invalid numeric value for ${field} on row ${rowNumber}.`);
  }
  return numeric;
}

export function parseReferralDataset(queueText: string): ReferralRecord[] {
  const lines = queueText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Provide a TSV queue with a header row and at least one referral row.");
  }

  const headers = lines[0].split("\t").map((header) => header.trim().toLowerCase());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Queue dataset is missing required column(s): ${missingHeaders.join(", ")}.`);
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split("\t");
    const rowNumber = index + 2;
    const get = (field: (typeof requiredHeaders)[number]) => {
      const fieldIndex = headers.indexOf(field);
      return compact(values[fieldIndex] ?? "");
    };

    const referralId = get("referral_id");
    const insuredName = get("insured_name");

    if (!referralId || !insuredName) {
      throw new Error(`Each row must include referral_id and insured_name. Check row ${rowNumber}.`);
    }

    return {
      referralId,
      insuredName,
      classOfBusiness: get("class_of_business"),
      territory: get("territory"),
      quotedPremiumGbp: parseNumber(get("quoted_premium_gbp"), "quoted_premium_gbp", rowNumber),
      tivGbp: parseNumber(get("tiv_gbp"), "tiv_gbp", rowNumber),
      lossRatioPct: parseNumber(get("loss_ratio_pct"), "loss_ratio_pct", rowNumber),
      daysToInception: parseNumber(get("days_to_inception"), "days_to_inception", rowNumber),
      missingFieldsCount: parseNumber(get("missing_fields_count"), "missing_fields_count", rowNumber),
      newBusiness: parseBoolean(get("new_business")),
      claimsActivity: parseBoolean(get("claims_activity")),
      sanctionsFlag: parseBoolean(get("sanctions_flag")),
      referralReason: get("referral_reason"),
      brokerTier: get("broker_tier")
    };
  });
}

function pushFactor(factors: ScoreFactor[], code: ScoreFactor["code"], contribution: number, detail: string) {
  if (contribution <= 0) {
    return;
  }

  factors.push({ code, contribution, detail });
}

function scoreReferralReason(reason: string): ScoreFactor | null {
  for (const rule of reasonRules) {
    if (rule.pattern.test(reason)) {
      return {
        code: "referral_reason",
        contribution: rule.points,
        detail: rule.detail
      };
    }
  }

  return null;
}

function scoreReferral(referral: ReferralRecord): RankedReferral {
  const factors: ScoreFactor[] = [];

  pushFactor(
    factors,
    "missing_fields",
    Math.min(referral.missingFieldsCount * 4, 20),
    `${referral.missingFieldsCount} missing field(s) still outstanding.`
  );

  pushFactor(
    factors,
    "sanctions",
    referral.sanctionsFlag ? 28 : 0,
    "Sanctions flag is set and requires immediate compliance validation."
  );

  const timePressure = referral.daysToInception <= 5 ? 12 : referral.daysToInception <= 14 ? 8 : referral.daysToInception <= 30 ? 4 : 0;
  pushFactor(factors, "time_pressure", timePressure, `${referral.daysToInception} day(s) remain until inception.`);

  const lossRatio = referral.lossRatioPct >= 90 ? 16 : referral.lossRatioPct >= 70 ? 10 : referral.lossRatioPct >= 50 ? 6 : 0;
  pushFactor(factors, "loss_ratio", lossRatio, `Historical loss ratio at ${referral.lossRatioPct}%.`);

  const tiv = referral.tivGbp >= 50_000_000 ? 18 : referral.tivGbp >= 20_000_000 ? 12 : referral.tivGbp >= 5_000_000 ? 6 : 0;
  pushFactor(factors, "tiv", tiv, `Exposure size of GBP ${referral.tivGbp.toLocaleString("en-GB")}.`);

  const premium = referral.quotedPremiumGbp >= 250_000 ? 6 : referral.quotedPremiumGbp >= 100_000 ? 4 : 0;
  pushFactor(factors, "premium", premium, `Premium at GBP ${referral.quotedPremiumGbp.toLocaleString("en-GB")}.`);

  pushFactor(factors, "new_business", referral.newBusiness ? 6 : 0, "New business referrals demand fuller front-end scrutiny.");
  pushFactor(factors, "claims_activity", referral.claimsActivity ? 8 : 0, "Open or recent claims activity is present.");

  const brokerTierScore = /bronze/i.test(referral.brokerTier) ? 4 : /silver/i.test(referral.brokerTier) ? 2 : 0;
  pushFactor(factors, "broker_tier", brokerTierScore, `Broker tier ${referral.brokerTier || "unknown"} determines oversight intensity.`);

  const territoryCount = referral.territory.split(";").map((item) => item.trim()).filter(Boolean).length;
  const territoryScope = territoryCount >= 3 ? 8 : territoryCount === 2 ? 4 : 0;
  pushFactor(factors, "territory_scope", territoryScope, `${territoryCount} territory scope marker(s) detected.`);

  const reasonFactor = scoreReferralReason(referral.referralReason);
  if (reasonFactor) {
    factors.push(reasonFactor);
  }

  const score = Math.min(100, factors.reduce((sum, factor) => sum + factor.contribution, 0));
  const urgencyBand = score >= 70 ? "critical" : score >= 50 ? "high" : score >= 30 ? "moderate" : "routine";

  const complexityMetric =
    referral.missingFieldsCount +
    (territoryCount > 1 ? 2 : 0) +
    (referral.newBusiness ? 2 : 0) +
    (referral.sanctionsFlag ? 3 : 0) +
    (/bespoke wording|manuscript|new territory/i.test(referral.referralReason) ? 2 : 0);

  const complexityBand = complexityMetric >= 7 ? "complex" : complexityMetric >= 3 ? "standard" : "streamlined";

  const recommendation =
    urgencyBand === "critical"
      ? "Escalate to senior referral reviewer now and hold binding authority until issues are cleared."
      : urgencyBand === "high"
        ? "Assign same-day review with targeted follow-ups on top scoring factors."
        : urgencyBand === "moderate"
          ? "Route through standard queue with factor-specific checks."
          : "Eligible for controlled fast-track once basic data completeness is confirmed.";

  return {
    referral,
    score,
    urgencyBand,
    complexityBand,
    factorBreakdown: factors.sort((a, b) => b.contribution - a.contribution),
    recommendation
  };
}

function buildSummary(rankedReferrals: RankedReferral[]): QueueSummary {
  const queueCount = rankedReferrals.length;
  const scores = rankedReferrals.map((item) => item.score);

  return {
    queueCount,
    highestScore: Math.max(...scores),
    averageScore: Number((scores.reduce((sum, score) => sum + score, 0) / queueCount).toFixed(1)),
    criticalCount: rankedReferrals.filter((item) => item.urgencyBand === "critical").length,
    highCount: rankedReferrals.filter((item) => item.urgencyBand === "high").length,
    moderateCount: rankedReferrals.filter((item) => item.urgencyBand === "moderate").length,
    routineCount: rankedReferrals.filter((item) => item.urgencyBand === "routine").length
  };
}

function buildWarnings(rankedReferrals: RankedReferral[]): QueueWarning[] {
  const warnings: QueueWarning[] = [];

  if (rankedReferrals.filter((item) => item.urgencyBand === "critical").length >= 2) {
    warnings.push({
      code: "critical_backlog",
      message: "Two or more critical referrals are present. Escalate queue ownership and set a same-day review order."
    });
  }

  if (rankedReferrals.some((item) => item.referral.sanctionsFlag)) {
    warnings.push({
      code: "sanctions_present",
      message: "At least one referral has a sanctions flag. Compliance clearance must precede any quote release."
    });
  }

  if (rankedReferrals.some((item) => item.referral.missingFieldsCount >= 4)) {
    warnings.push({
      code: "data_gaps",
      message: "Material data gaps exist in the queue. Request completion before treating medium-scored items as bindable."
    });
  }

  return warnings;
}

function buildTopDrivers(rankedReferrals: RankedReferral[]): string[] {
  const factorTotals = new Map<string, number>();

  rankedReferrals.forEach((item) => {
    item.factorBreakdown.forEach((factor) => {
      factorTotals.set(factor.code, (factorTotals.get(factor.code) ?? 0) + factor.contribution);
    });
  });

  return [...factorTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([code, total]) => `${code.replace(/_/g, " ")}: ${total}`);
}

function buildQueryHits(queueText: string, question?: string | null): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/\W+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (tokens.length === 0) {
    return [];
  }

  return queueText
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter(Boolean)
    .filter((line) => tokens.some((token) => line.toLowerCase().includes(token)))
    .slice(0, 6);
}

export function buildReferralQueueInsight(queueText: string, question?: string | null): QueueInsight {
  const referrals = parseReferralDataset(queueText);

  if (referrals.length < 2) {
    throw new Error("Provide at least two referral rows so queue priority can be meaningfully ranked.");
  }

  const rankedReferrals = referrals.map(scoreReferral).sort((a, b) => b.score - a.score || a.referral.referralId.localeCompare(b.referral.referralId));

  return {
    rankedReferrals,
    summary: buildSummary(rankedReferrals),
    warnings: buildWarnings(rankedReferrals),
    topDrivers: buildTopDrivers(rankedReferrals),
    queryHits: buildQueryHits(queueText, question)
  };
}

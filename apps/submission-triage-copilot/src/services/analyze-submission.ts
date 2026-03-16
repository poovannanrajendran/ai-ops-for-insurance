import type { ExtractedSubmission, SubmissionAnalysis } from "@/types/submission";

type FieldMap = Record<string, string>;

function parseFieldMap(text: string): FieldMap {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<FieldMap>((accumulator, line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || !value) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
}

function extractLimitAmount(
  text: string,
  fields: FieldMap
): { amount: number | null; currency: string | null } {
  const limitSource = fields["limit"] ?? fields["coverage amount"];
  const searchText = limitSource ? `limit ${limitSource}` : text;
  const match = searchText.match(
    /(?:limit|line|sum insured|tiv)[^\d]{0,24}([$£€]|usd|gbp|eur)?\s*([\d,.]+)\s*(m|mn|million|k|thousand)?/i
  );

  if (!match) {
    return { amount: null, currency: null };
  }

  const currencyToken = match[1]?.toUpperCase() ?? fields["currency"]?.toUpperCase() ?? null;
  const amountToken = match[2]?.replace(/,/g, "");
  const magnitudeToken = match[3]?.toLowerCase();
  const base = Number(amountToken);

  if (!Number.isFinite(base)) {
    return { amount: null, currency: currencyToken };
  }

  if (magnitudeToken === "m" || magnitudeToken === "mn" || magnitudeToken === "million") {
    return { amount: base * 1_000_000, currency: currencyToken };
  }

  if (magnitudeToken === "k" || magnitudeToken === "thousand") {
    return { amount: base * 1_000, currency: currencyToken };
  }

  return { amount: base, currency: currencyToken };
}

function extractClassOfBusiness(text: string): string {
  const lowered = text.toLowerCase();

  if (lowered.includes("cyber") || lowered.includes("ransomware")) {
    return "Cyber";
  }
  if (lowered.includes("marine") || lowered.includes("cargo") || lowered.includes("vessel")) {
    return "Marine";
  }
  if (lowered.includes("property") || lowered.includes("building") || lowered.includes("warehouse")) {
    return "Property";
  }
  if (lowered.includes("professional indemnity") || lowered.includes("pi ")) {
    return "Professional Indemnity";
  }
  if (lowered.includes("casualty") || lowered.includes("liability")) {
    return "Casualty";
  }

  return "Unknown";
}

function extractTerritory(text: string, fields: FieldMap): string {
  const candidate = fields["territory"] ?? fields["risk location country"];
  if (candidate) {
    return candidate;
  }

  const lowered = text.toLowerCase();

  if (lowered.includes("united kingdom") || lowered.includes("uk") || lowered.includes("london")) {
    return "United Kingdom";
  }
  if (lowered.includes("europe") || lowered.includes("eu")) {
    return "Europe";
  }
  if (lowered.includes("united states") || lowered.includes("usa") || lowered.includes("us ")) {
    return "United States";
  }
  if (lowered.includes("global") || lowered.includes("worldwide")) {
    return "Global";
  }

  return "Unclear";
}

function extractBroker(text: string, fields: FieldMap): string | null {
  const fieldBroker = fields["broker"];
  if (fieldBroker) {
    return fieldBroker;
  }

  const match = text.match(/broker:\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

function buildWarningFlags(text: string): string[] {
  const lowered = text.toLowerCase();
  const flags: string[] = [];

  if (lowered.includes("sanction")) flags.push("Sanctions exposure requires escalation");
  if (lowered.includes("asbestos")) flags.push("Asbestos-related wording requires decline review");
  if (lowered.includes("wildfire")) flags.push("Cat exposure signal detected");
  if (lowered.includes("loss history") && lowered.includes("poor")) flags.push("Adverse loss history detected");

  return flags;
}

export function extractSubmission(text: string): ExtractedSubmission {
  const fields = parseFieldMap(text);
  const { amount, currency } = extractLimitAmount(text, fields);

  return {
    broker: extractBroker(text, fields),
    brokerContact: fields["broker contact"] ?? null,
    insuredName: fields["insured"] ?? fields["insured name"] ?? null,
    headquarters: fields["headquarters"] ?? null,
    attachment: fields["attachment"] ?? null,
    business: fields["business"] ?? null,
    revenue: fields["revenue"] ?? null,
    employees: fields["employees"] ?? null,
    locations: fields["locations"] ?? null,
    construction: fields["construction"] ?? null,
    occupancy: fields["occupancy"] ?? null,
    fireProtection: fields["fire protection"] ?? null,
    natCat: fields["nat cat"] ?? null,
    riskControls: fields["risk controls"] ?? null,
    claimsHistory: fields["claims history"] ?? null,
    lossHistory: fields["loss history"] ?? null,
    expiringCarrier: fields["expiring carrier"] ?? null,
    expiringPremium: fields["expiring premium"] ?? null,
    desiredInception: fields["desired inception"] ?? fields["inception date"] ?? null,
    brokerObjective: fields["broker objective"] ?? null,
    notes: fields["notes"] ?? null,
    classOfBusiness: extractClassOfBusiness(text),
    territory: extractTerritory(text, fields),
    currency,
    limitAmount: amount,
    warningFlags: buildWarningFlags(text),
    fields
  };
}

export function analyzeSubmission(text: string): SubmissionAnalysis {
  const extracted = extractSubmission(text);
  let score = 0;
  const rationale: string[] = [];

  if (["Property", "Marine", "Casualty"].includes(extracted.classOfBusiness)) {
    score += 2;
    rationale.push(`${extracted.classOfBusiness} is in the current preferred band for the MVP rules.`);
  } else if (extracted.classOfBusiness === "Cyber") {
    score -= 3;
    rationale.push("Cyber is outside the MVP preferred appetite and should be declined or escalated.");
  } else {
    rationale.push("Class of business is unclear, so manual review is required.");
  }

  if (["United Kingdom", "Europe"].includes(extracted.territory)) {
    score += 1;
    rationale.push(`Territory signal is ${extracted.territory}, which is favorable for the initial appetite rules.`);
  } else if (extracted.territory === "Global") {
    score -= 1;
    rationale.push("Global territory adds complexity and pushes the case toward referral.");
  }

  if (typeof extracted.limitAmount === "number") {
    if (extracted.limitAmount <= 5_000_000) {
      score += 2;
      rationale.push("Requested limit is within the preferred low-friction band.");
    } else if (extracted.limitAmount <= 10_000_000) {
      score += 1;
      rationale.push("Requested limit is acceptable but should still be reviewed.");
    } else {
      score -= 1;
      rationale.push("Requested limit is above the preferred MVP threshold.");
    }
  } else {
    rationale.push("No reliable limit was extracted from the submission.");
  }

  if (extracted.warningFlags.length > 0) {
    score -= extracted.warningFlags.length;
    rationale.push(...extracted.warningFlags);
  }

  const hardDecline =
    extracted.classOfBusiness === "Cyber" ||
    extracted.warningFlags.some((flag) => flag.toLowerCase().includes("asbestos"));

  const decision =
    hardDecline || score <= 0 ? "decline" : score >= 4 ? "accept" : "refer";

  const confidence = Number(
    Math.min(0.93, Math.max(0.52, 0.58 + score * 0.08)).toFixed(2)
  );

  return {
    extracted,
    decision,
    confidence,
    rationale
  };
}

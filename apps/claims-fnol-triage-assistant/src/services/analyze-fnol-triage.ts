import type { FnolTriageInsight, ParsedFnol, TriageDecision, TriageFactor, TriageSummary, TriageWarning } from "@/types/fnol-triage";

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function pickLabeledValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`(?:^|\\n)${label}\\s*:\\s*(.+)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) {
      return compact(match[1]);
    }
  }
  return null;
}

function parseNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const digits = value.replace(/[^\d.-]/g, "");
  if (!digits) {
    return null;
  }
  const numeric = Number(digits);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseBooleanToken(value: string | null): boolean | null {
  if (!value) {
    return null;
  }
  if (/^(yes|true|present|filed|received)$/i.test(value)) return true;
  if (/^(no|false|none|not filed|missing)$/i.test(value)) return false;
  return null;
}

function parseSeverity(value: string | null, text: string): ParsedFnol["propertyDamageSeverity"] {
  const normalized = `${value ?? ""} ${text}`.toLowerCase();
  if (/(total loss|major structural|fire spread|severe damage|collapse)/.test(normalized)) return "severe";
  if (/(significant|moderate|water ingress|partial damage|impact damage)/.test(normalized)) return "moderate";
  if (/(minor|small leak|scuff|light damage|cosmetic)/.test(normalized)) return "minor";
  return "unknown";
}

function inferMissingCount(parsed: Omit<ParsedFnol, "missingFieldCount">): number {
  let missing = 0;
  if (!parsed.claimReference) missing += 1;
  if (!parsed.insuredName) missing += 1;
  if (!parsed.classOfBusiness) missing += 1;
  if (!parsed.lossDate) missing += 1;
  if (!parsed.location) missing += 1;
  if (!parsed.causeOfLoss) missing += 1;
  if (parsed.estimatedReserveGbp == null) missing += 1;
  if (parsed.policeReport == null) missing += 1;
  return missing;
}

export function parseFnolNotice(fnolText: string): ParsedFnol {
  const claimReference = pickLabeledValue(fnolText, ["Claim Reference", "FNOL Reference", "Reference"]);
  const insuredName = pickLabeledValue(fnolText, ["Insured Name", "Insured"]);
  const classOfBusiness = pickLabeledValue(fnolText, ["Class of Business", "Class"]);
  const lossDate = pickLabeledValue(fnolText, ["Loss Date", "Date of Loss"]);
  const reportedDate = pickLabeledValue(fnolText, ["Reported Date", "Date Reported"]);
  const location = pickLabeledValue(fnolText, ["Location", "Loss Location", "Territory"]);
  const causeOfLoss = pickLabeledValue(fnolText, ["Cause of Loss", "Cause", "Incident Type"]);
  const reserveRaw = pickLabeledValue(fnolText, ["Estimated Reserve", "Reserve", "Initial Reserve"]);
  const currency = pickLabeledValue(fnolText, ["Currency"]);
  const injuryRaw = pickLabeledValue(fnolText, ["Injury Count", "Injuries"]);
  const thirdPartyInjury = parseBooleanToken(pickLabeledValue(fnolText, ["Third Party Injury", "Third-Party Injury"])) ?? /bodily injury|third party injury/i.test(fnolText);
  const fatalityIndicator = parseBooleanToken(pickLabeledValue(fnolText, ["Fatality Indicator", "Fatality"])) ?? /fatality|death/i.test(fnolText);
  const policeReport = parseBooleanToken(pickLabeledValue(fnolText, ["Police Report", "Police Report Filed"]));
  const fraudIndicator = parseBooleanToken(pickLabeledValue(fnolText, ["Fraud Indicator", "Fraud Suspected"])) ?? /fraud|arson|staged/i.test(fnolText);
  const claimantRepresented = parseBooleanToken(pickLabeledValue(fnolText, ["Claimant Represented", "Solicitor Instructed"])) ?? /solicitor|claimant counsel|represented/i.test(fnolText);
  const litigationIndicator = parseBooleanToken(pickLabeledValue(fnolText, ["Litigation Indicator", "Litigation"])) ?? /litigation|legal proceedings|external counsel/i.test(fnolText);
  const damageSeverity = parseSeverity(pickLabeledValue(fnolText, ["Property Damage Severity", "Damage Severity"]), fnolText);
  const businessInterruptionDays = parseNumber(pickLabeledValue(fnolText, ["Business Interruption Days", "BI Days"])) ?? (/business interruption/i.test(fnolText) ? 5 : 0);

  const parsedWithoutMissing: Omit<ParsedFnol, "missingFieldCount"> = {
    claimReference,
    insuredName,
    classOfBusiness,
    lossDate,
    reportedDate,
    location,
    causeOfLoss,
    estimatedReserveGbp: parseNumber(reserveRaw),
    currency,
    injuryCount: parseNumber(injuryRaw) ?? (thirdPartyInjury ? 1 : 0),
    thirdPartyInjury,
    fatalityIndicator,
    policeReport,
    fraudIndicator,
    claimantRepresented,
    litigationIndicator,
    propertyDamageSeverity: damageSeverity,
    businessInterruptionDays
  };

  return {
    ...parsedWithoutMissing,
    missingFieldCount: inferMissingCount(parsedWithoutMissing)
  };
}

function addFactor(factors: TriageFactor[], code: TriageFactor["code"], contribution: number, detail: string) {
  if (contribution > 0) {
    factors.push({ code, contribution, detail });
  }
}

function buildFactors(parsed: ParsedFnol): TriageFactor[] {
  const factors: TriageFactor[] = [];

  addFactor(factors, "fatality", parsed.fatalityIndicator ? 40 : 0, "Fatality indicator present. Mandatory senior claims escalation.");
  addFactor(
    factors,
    "injury",
    parsed.thirdPartyInjury ? (parsed.injuryCount >= 2 ? 30 : 22) : 0,
    `${parsed.injuryCount} injury marker(s) with third-party bodily injury exposure.`
  );
  addFactor(factors, "fraud", parsed.fraudIndicator ? 28 : 0, "Fraud indicator or suspicious loss wording detected.");
  addFactor(
    factors,
    "litigation",
    parsed.claimantRepresented || parsed.litigationIndicator ? 20 : 0,
    "Represented claimant or litigation signal requires handler escalation."
  );

  const reserve = parsed.estimatedReserveGbp ?? 0;
  const reserveScore = reserve >= 250_000 ? 24 : reserve >= 100_000 ? 18 : reserve >= 25_000 ? 10 : reserve > 0 ? 3 : 0;
  addFactor(factors, "reserve", reserveScore, `Initial reserve marker at GBP ${reserve.toLocaleString("en-GB") || "0"}.`);

  const missingDataScore = Math.min(parsed.missingFieldCount * 4, 20);
  addFactor(factors, "missing_data", missingDataScore, `${parsed.missingFieldCount} core FNOL field(s) are missing or unclear.`);

  addFactor(
    factors,
    "police_report",
    parsed.policeReport === false ? 8 : 0,
    "Police report is missing or marked as not filed for a potentially contentious loss."
  );

  const damageScore = parsed.propertyDamageSeverity === "severe" ? 14 : parsed.propertyDamageSeverity === "moderate" ? 8 : parsed.propertyDamageSeverity === "minor" ? 2 : 0;
  addFactor(factors, "damage_severity", damageScore, `Property damage severity assessed as ${parsed.propertyDamageSeverity}.`);

  const biScore = parsed.businessInterruptionDays >= 14 ? 12 : parsed.businessInterruptionDays >= 5 ? 6 : parsed.businessInterruptionDays > 0 ? 2 : 0;
  addFactor(factors, "business_interruption", biScore, `${parsed.businessInterruptionDays} indicated business interruption day(s).`);

  const complexCause = /pollution|collapse|fire spread|multi vehicle|catastrophe|contamination|regulator/i.test(parsed.causeOfLoss ?? "") ? 10 : 0;
  addFactor(factors, "complex_cause", complexCause, "Cause of loss suggests multi-party, regulatory, or specialist handling complexity.");

  return factors.sort((a, b) => b.contribution - a.contribution);
}

function dispositionFromFactors(parsed: ParsedFnol, score: number): TriageDecision {
  const reserveText = `GBP ${(parsed.estimatedReserveGbp ?? 0).toLocaleString("en-GB")}`;
  const injuryText = parsed.thirdPartyInjury ? `${parsed.injuryCount} injury marker(s)` : "no third-party injury marker";
  const representationText = parsed.claimantRepresented ? "represented claimant" : "unrepresented claimant";
  const shouldEscalate =
    parsed.fatalityIndicator ||
    parsed.fraudIndicator ||
    parsed.claimantRepresented ||
    parsed.litigationIndicator ||
    (parsed.thirdPartyInjury && parsed.injuryCount > 0) ||
    score >= 70;

  const shouldManualReview =
    parsed.missingFieldCount >= 2 ||
    (parsed.estimatedReserveGbp ?? 0) >= 25_000 ||
    parsed.propertyDamageSeverity === "moderate" ||
    parsed.businessInterruptionDays >= 5 ||
    score >= 30;

  if (shouldEscalate) {
    return {
      disposition: "escalate",
      headline: "Escalate to senior claims handler immediately.",
      rationale: "Severity, bodily injury, fraud, litigation, or reserve complexity exceeds controlled fast-track thresholds.",
      nextActions: [
        `Assign senior handler and confirm indemnity / coverage ownership for reserve ${reserveText}.`,
        `Secure evidence pack with police status=${parsed.policeReport ? "filed" : "missing"}, ${injuryText}, and ${representationText}.`,
        `Set same-day governance checkpoint for score ${score} with litigation=${parsed.litigationIndicator ? "yes" : "no"} and fraud=${parsed.fraudIndicator ? "yes" : "no"}.`
      ]
    };
  }

  if (shouldManualReview) {
    return {
      disposition: "manual-review",
      headline: "Route to standard handler review before acknowledgement.",
      rationale: "The FNOL contains moderate complexity, missing core data, or reserve pressure that needs human review.",
      nextActions: [
        `Request ${parsed.missingFieldCount} missing FNOL field(s) plus supporting documents before intake closure.`,
        `Validate reserve ${reserveText}, cause='${parsed.causeOfLoss ?? "unstated"}', and police/third-party references.`,
        `Release acknowledgement once completeness improves and owner is confirmed for disposition score ${score}.`
      ]
    };
  }

  return {
    disposition: "fast-track",
    headline: "Eligible for controlled fast-track handling.",
    rationale: "Low reserve, no injury/fraud/litigation markers, and sufficient completeness support accelerated intake.",
    nextActions: [
      `Acknowledge receipt and allocate to fast-track queue at reserve ${reserveText}.`,
      `Confirm low-severity profile (${parsed.propertyDamageSeverity}) and obtain standard photo / invoice pack.`,
      `Monitor for late-emerging markers: injury=${parsed.thirdPartyInjury ? "yes" : "no"}, fraud=${parsed.fraudIndicator ? "yes" : "no"}, representation=${parsed.claimantRepresented ? "yes" : "no"}.`
    ]
  };
}

function buildWarnings(parsed: ParsedFnol, decision: TriageDecision): TriageWarning[] {
  const warnings: TriageWarning[] = [];

  if (decision.disposition === "escalate") {
    warnings.push({
      code: "escalate_now",
      message: "Escalation threshold has been met. Do not leave this FNOL in unattended intake status."
    });
  }

  if (parsed.missingFieldCount >= 2) {
    warnings.push({
      code: "data_gap",
      message: "Core FNOL fields are missing. Reserve, coverage, and causation assumptions should stay provisional."
    });
  }

  if (parsed.thirdPartyInjury || parsed.fraudIndicator || parsed.claimantRepresented) {
    warnings.push({
      code: "claims_governance",
      message: "Governance-sensitive markers detected. Confirm diary control, representation, and evidence preservation steps."
    });
  }

  return warnings;
}

function reserveBand(reserve: number | null): string {
  if (reserve == null || reserve === 0) return "Unstated";
  if (reserve >= 250_000) return "GBP 250k+";
  if (reserve >= 100_000) return "GBP 100k - 249k";
  if (reserve >= 25_000) return "GBP 25k - 99k";
  return "Under GBP 25k";
}

function buildQueryHits(fnolText: string, question?: string | null): string[] {
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

  return fnolText
    .split(/\n+/)
    .map((line) => compact(line))
    .filter(Boolean)
    .filter((line) => tokens.some((token) => line.toLowerCase().includes(token)))
    .slice(0, 5);
}

export function analyzeFnolTriage(fnolText: string, question?: string | null): FnolTriageInsight {
  const normalized = compact(fnolText);
  const parsed = parseFnolNotice(fnolText);
  const factors = buildFactors(parsed);
  const triageScore = Math.min(100, factors.reduce((sum, factor) => sum + factor.contribution, 0));
  const decision = dispositionFromFactors(parsed, triageScore);
  const warnings = buildWarnings(parsed, decision);

  const summary: TriageSummary = {
    disposition: decision.disposition,
    triageScore,
    reserveBand: reserveBand(parsed.estimatedReserveGbp),
    injuryCount: parsed.injuryCount,
    missingFieldCount: parsed.missingFieldCount,
    warningCount: warnings.length
  };

  return {
    parsedFnol: parsed,
    summary,
    factors,
    warnings,
    decision,
    queryHits: buildQueryHits(normalized, question)
  };
}

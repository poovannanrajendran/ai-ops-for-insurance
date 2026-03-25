import type {
  BrokerSubmissionFields,
  BrokerSubmissionInsight,
  InformationGap,
  ReferralFlag,
  SubmissionSection,
  SubmissionStatusMetric
} from "@/types/broker-submission";

const requiredLabels = [
  "Broker",
  "Insured Name",
  "Class of Business",
  "Territory",
  "Inception Date",
  "Requested Limit",
  "Attachment",
  "Estimated Premium",
  "Claims Summary",
  "Security Requirements",
  "Target Quote By",
  "Narrative"
] as const;

const trackedLabels = [...requiredLabels, "Revenue", "Occupancies"] as const;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normaliseLabel(value: string): string {
  return clean(value).toLowerCase();
}

function parseMoney(value: string): number {
  const numeric = value.replace(/[^0-9.-]+/g, "");
  return numeric ? Number(numeric) : 0;
}

function parseSubmissionLines(submissionText: string): Map<string, string> {
  const lineMap = new Map<string, string>();

  for (const line of submissionText.split(/\r?\n/)) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) {
      continue;
    }

    lineMap.set(normaliseLabel(key), clean(rest.join(":")));
  }

  return lineMap;
}

export function parseBrokerSubmission(submissionText: string): {
  fields: BrokerSubmissionFields;
  missing: string[];
  completenessPct: number;
} {
  const lineMap = parseSubmissionLines(submissionText);
  const missing = requiredLabels.filter((label) => !lineMap.has(normaliseLabel(label)));
  const populatedTracked = trackedLabels.filter((label) => {
    const value = lineMap.get(normaliseLabel(label));
    return Boolean(value && clean(value) && clean(value).toLowerCase() !== "tbc");
  }).length;

  const fields: BrokerSubmissionFields = {
    broker: lineMap.get("broker") ?? "Unknown",
    insuredName: lineMap.get("insured name") ?? "Unknown",
    classOfBusiness: lineMap.get("class of business") ?? "Unknown",
    territory: lineMap.get("territory") ?? "Unknown",
    inceptionDate: lineMap.get("inception date") ?? "Unknown",
    requestedLimitGbp: parseMoney(lineMap.get("requested limit") ?? "0"),
    attachmentGbp: parseMoney(lineMap.get("attachment") ?? "0"),
    estimatedPremiumGbp: parseMoney(lineMap.get("estimated premium") ?? "0"),
    claimsSummary: lineMap.get("claims summary") ?? "Unknown",
    securityRequirements: lineMap.get("security requirements") ?? "Unknown",
    targetQuoteBy: lineMap.get("target quote by") ?? "Unknown",
    narrative: lineMap.get("narrative") ?? "Unknown",
    revenueGbp: parseMoney(lineMap.get("revenue") ?? "0"),
    occupancies: lineMap.get("occupancies") ?? "Not supplied"
  };

  return {
    fields,
    missing,
    completenessPct: Math.round((populatedTracked / trackedLabels.length) * 100)
  };
}

function buildReferralFlags(fields: BrokerSubmissionFields): ReferralFlag[] {
  const flags: ReferralFlag[] = [];
  const territory = fields.territory.toLowerCase();
  const classOfBusiness = fields.classOfBusiness.toLowerCase();
  const claims = fields.claimsSummary.toLowerCase();
  const controls = `${fields.securityRequirements} ${fields.narrative}`.toLowerCase();

  if (fields.requestedLimitGbp >= 15000000) {
    flags.push({
      code: "large_line_request",
      severity: "red",
      message: "Requested limit is GBP 15,000,000 or above and exceeds standard delegated line size."
    });
  } else if (fields.requestedLimitGbp >= 8000000) {
    flags.push({
      code: "elevated_line_request",
      severity: "amber",
      message: "Requested limit is above GBP 8,000,000 and should be checked against current line deployment."
    });
  }

  if (fields.attachmentGbp > 0 && fields.requestedLimitGbp / fields.attachmentGbp >= 25) {
    flags.push({
      code: "thin_attachment",
      severity: "amber",
      message: "Limit-to-attachment ratio is above 25x, indicating a thin attachment for the requested line."
    });
  }

  if ((territory.includes("united states") || territory.includes("canada")) && classOfBusiness.includes("liability")) {
    flags.push({
      code: "north_america_liability",
      severity: "amber",
      message: "North American liability exposure needs lead underwriter referral before market release."
    });
  }

  if (/(open|recall|fatal|bodily injury|regulator|ransomware)/.test(claims)) {
    flags.push({
      code: "adverse_claims_history",
      severity: /(fatal|regulator|recall|ransomware)/.test(claims) ? "red" : "amber",
      message: "Claims narrative includes open or severe loss activity that requires referral context in the pack."
    });
  }

  if (/(in progress|pending|not deployed|remediation|single supplier|combustible panel)/.test(controls)) {
    flags.push({
      code: "control_improvement_pending",
      severity: "amber",
      message: "Material control improvements remain outstanding and should be disclosed in broker follow-up notes."
    });
  }

  return flags;
}

function buildInformationGaps(fields: BrokerSubmissionFields): InformationGap[] {
  const gaps: InformationGap[] = [];

  if (fields.revenueGbp <= 0) {
    gaps.push({
      label: "Revenue",
      impact: "Pricing confidence is weaker without current turnover.",
      action: "Request latest annual revenue or sales split before release to market."
    });
  }

  if (fields.occupancies === "Not supplied") {
    gaps.push({
      label: "Occupancies",
      impact: "Risk presentation is thinner without site or product detail.",
      action: "Confirm occupancies, site count, or product mix in the broker pack."
    });
  }

  if (fields.narrative.length < 180) {
    gaps.push({
      label: "Narrative depth",
      impact: "Underwriters may ask for fuller operating context and rationale for the placement.",
      action: "Expand the narrative with operational footprint, distribution, and renewal context."
    });
  }

  return gaps;
}

function buildSections(
  fields: BrokerSubmissionFields,
  referralFlags: ReferralFlag[],
  informationGaps: InformationGap[]
): SubmissionSection[] {
  const limitLine = `Requested limit GBP ${fields.requestedLimitGbp.toLocaleString("en-GB")} xs GBP ${fields.attachmentGbp.toLocaleString("en-GB")} attachment with estimated premium GBP ${fields.estimatedPremiumGbp.toLocaleString("en-GB")}.`;

  return [
    {
      title: "Market summary",
      bullets: [
        `${fields.broker} is presenting ${fields.insuredName} for ${fields.classOfBusiness} coverage across ${fields.territory}.`,
        `${limitLine}`,
        `Inception is ${fields.inceptionDate} and broker target quote date is ${fields.targetQuoteBy}.`
      ]
    },
    {
      title: "Risk narrative",
      bullets: [
        fields.narrative,
        `Occupancies: ${fields.occupancies}.`,
        `Claims background: ${fields.claimsSummary}`,
        `Controls: ${fields.securityRequirements}`
      ]
    },
    {
      title: "Referral view",
      bullets:
        referralFlags.length > 0
          ? referralFlags.map((flag) => flag.message)
          : ["No automatic referral trigger was raised by the deterministic ruleset."]
    },
    {
      title: "Broker follow-up",
      bullets:
        informationGaps.length > 0
          ? informationGaps.map((gap) => `${gap.label}: ${gap.action}`)
          : ["Submission pack is sufficiently complete for initial market release."]
    }
  ];
}

function buildStatusMetrics(
  referralFlags: ReferralFlag[],
  informationGaps: InformationGap[],
  readiness: "ready" | "referral"
): SubmissionStatusMetric[] {
  const redFlagCount = referralFlags.filter((flag) => flag.severity === "red").length;

  return [
    {
      label: "Submission readiness",
      tone: readiness === "ready" ? "green" : redFlagCount > 0 ? "red" : "amber",
      value: readiness === "ready" ? "Ready to market" : "Referral required"
    },
    {
      label: "Referral triggers",
      tone:
        referralFlags.length === 0 ? "green" : redFlagCount > 0 ? "red" : "amber",
      value:
        referralFlags.length === 0
          ? "No automatic triggers"
          : `${referralFlags.length} trigger${referralFlags.length === 1 ? "" : "s"} flagged`
    },
    {
      label: "Information quality",
      tone:
        informationGaps.length === 0 ? "green" : informationGaps.length >= 3 ? "red" : "amber",
      value:
        informationGaps.length === 0
          ? "Complete broker pack"
          : `${informationGaps.length} follow-up item${informationGaps.length === 1 ? "" : "s"}`
    }
  ];
}

function buildQueryHits(insight: BrokerSubmissionInsight, question?: string): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);

  if (tokens.length === 0) {
    return [];
  }

  const searchLines = [
    ...insight.sections.flatMap((section) => section.bullets),
    ...insight.referralFlags.map((flag) => flag.message),
    ...insight.informationGaps.map((gap) => `${gap.label}: ${gap.action}`),
    insight.commentary
  ];

  const hits: string[] = [];
  for (const line of searchLines) {
    const lower = line.toLowerCase();
    if (tokens.some((token) => lower.includes(token))) {
      hits.push(line);
    }
    if (hits.length >= 6) {
      break;
    }
  }

  return hits;
}

export function analyzeBrokerSubmission(
  submissionText: string,
  question?: string
): { missing: string[]; insight: BrokerSubmissionInsight } {
  const parsed = parseBrokerSubmission(submissionText);
  const referralFlags = buildReferralFlags(parsed.fields);
  const informationGaps = buildInformationGaps(parsed.fields);
  const redFlagCount = referralFlags.filter((flag) => flag.severity === "red").length;
  const readiness = referralFlags.length === 0 && informationGaps.length <= 1 ? "ready" : "referral";
  const sections = buildSections(parsed.fields, referralFlags, informationGaps);
  const marketStance =
    readiness === "ready"
      ? "Ready for initial market release."
      : redFlagCount > 0
        ? "Hold for senior underwriter referral before release."
        : "Release only after broker follow-up and referral commentary are added.";

  const insight: BrokerSubmissionInsight = {
    summary: {
      completenessPct: parsed.completenessPct,
      referralCount: referralFlags.length,
      redFlagCount,
      informationGapCount: informationGaps.length,
      readiness,
      marketStance
    },
    fields: parsed.fields,
    sections,
    referralFlags,
    informationGaps,
    statusMetrics: buildStatusMetrics(referralFlags, informationGaps, readiness),
    queryHits: [],
    commentary:
      readiness === "ready"
        ? `${parsed.fields.insuredName} is packaged with a complete broker narrative and no automatic referral triggers. Proceed with an initial market summary built around ${parsed.fields.classOfBusiness.toLowerCase()} exposure, controls, and the requested line.`
        : `${parsed.fields.insuredName} needs referral handling before release. The current pack shows ${referralFlags.length} referral trigger(s) and ${informationGaps.length} follow-up item(s), so the broker summary should frame controls, claims, and required clarifications explicitly.`
  };

  insight.queryHits = buildQueryHits(insight, question);

  return {
    missing: parsed.missing,
    insight
  };
}

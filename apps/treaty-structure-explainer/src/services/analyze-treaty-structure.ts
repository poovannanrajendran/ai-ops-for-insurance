import type {
  LayerBand,
  LossScenario,
  TreatyInsight,
  TreatyTerms,
  TreatyWarning
} from "@/types/treaty-structure";

const requiredLabels = [
  "Treaty Type",
  "Subject Business",
  "Territory",
  "Attachment",
  "Limit",
  "Ceding Commission",
  "Signed Share",
  "Reinstatements"
] as const;

function clean(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function parseGbp(value: string): number {
  const normalised = value.replace(/GBP/gi, "").replace(/,/g, "").trim();
  return Number(normalised);
}

function parsePct(value: string): number {
  const normalised = value.replace(/%/g, "").trim();
  return Number(normalised);
}

function parseTerms(treatyText: string): { missing: string[]; terms: TreatyTerms } {
  const lineMap = new Map<string, string>();

  for (const line of treatyText.split(/\r?\n/)) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) {
      continue;
    }
    lineMap.set(clean(key), clean(rest.join(":")));
  }

  const missing = requiredLabels.filter((label) => !lineMap.has(label));

  const terms: TreatyTerms = {
    treatyType: lineMap.get("Treaty Type") ?? "Unknown",
    subjectBusiness: lineMap.get("Subject Business") ?? "Unknown",
    territory: lineMap.get("Territory") ?? "Unknown",
    attachmentGbp: parseGbp(lineMap.get("Attachment") ?? "0"),
    limitGbp: parseGbp(lineMap.get("Limit") ?? "0"),
    cedingCommissionPct: parsePct(lineMap.get("Ceding Commission") ?? "0"),
    reinstatements: Number(lineMap.get("Reinstatements") ?? "0"),
    signedSharePct: parsePct(lineMap.get("Signed Share") ?? "100")
  };

  return { missing, terms };
}

function buildLayerBands(terms: TreatyTerms): LayerBand[] {
  return [
    {
      label: "Cedant retention",
      fromGbp: 0,
      toGbp: terms.attachmentGbp,
      payer: "Cedant"
    },
    {
      label: "Treaty layer",
      fromGbp: terms.attachmentGbp,
      toGbp: terms.attachmentGbp + terms.limitGbp,
      payer: "Reinsurer"
    },
    {
      label: "Above treaty limit",
      fromGbp: terms.attachmentGbp + terms.limitGbp,
      toGbp: terms.attachmentGbp + terms.limitGbp * 1.5,
      payer: "Cedant / out-of-programme market"
    }
  ];
}

function evaluateLoss(terms: TreatyTerms, grossLossGbp: number, title: string): LossScenario {
  const retained = Math.min(grossLossGbp, terms.attachmentGbp);
  const grossAboveAttachment = Math.max(0, grossLossGbp - terms.attachmentGbp);
  const reinsurerPaidRaw = Math.min(grossAboveAttachment, terms.limitGbp);
  const reinsurerPaid = (reinsurerPaidRaw * terms.signedSharePct) / 100;
  const uninsuredAboveLimit = Math.max(0, grossLossGbp - terms.attachmentGbp - terms.limitGbp);

  return {
    title,
    grossLossGbp,
    cedantRetainedGbp: retained,
    reinsurerPaidGbp: Number(reinsurerPaid.toFixed(0)),
    uninsuredAboveLimitGbp: uninsuredAboveLimit
  };
}

function buildWarnings(terms: TreatyTerms): TreatyWarning[] {
  const warnings: TreatyWarning[] = [];

  if (terms.attachmentGbp <= 0 || terms.limitGbp <= 0) {
    warnings.push({
      code: "invalid_layer_values",
      severity: "red",
      message: "Attachment and limit should be greater than zero for a valid treaty layer."
    });
  }

  if (terms.attachmentGbp > 0 && terms.limitGbp / terms.attachmentGbp < 1) {
    warnings.push({
      code: "thin_limit",
      severity: "amber",
      message: "Treaty limit is thinner than attachment and may exhaust quickly under severe losses."
    });
  }

  if (terms.reinstatements === 0) {
    warnings.push({
      code: "no_reinstatements",
      severity: "amber",
      message: "No reinstatements configured; post-event protection may drop after first layer exhaustion."
    });
  }

  if (terms.signedSharePct < 100) {
    warnings.push({
      code: "partial_share",
      severity: "amber",
      message:
        "Signed share is below 100%, leaving proportional participation gap to place or retain."
    });
  }

  return warnings;
}

function buildQueryHits(insight: TreatyInsight, question?: string): string[] {
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
    `Treaty type ${insight.terms.treatyType}`,
    `Attachment GBP ${insight.terms.attachmentGbp.toLocaleString("en-GB")}`,
    `Limit GBP ${insight.terms.limitGbp.toLocaleString("en-GB")}`,
    ...insight.narrative,
    ...insight.warnings.map((warning) => warning.message)
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

export function analyzeTreatyStructure(
  treatyText: string,
  question?: string
): { missing: string[]; insight: TreatyInsight } {
  const { missing, terms } = parseTerms(treatyText);

  const layerBands = buildLayerBands(terms);
  const scenarios = [
    evaluateLoss(terms, Math.round(terms.attachmentGbp * 0.8), "Loss within retention"),
    evaluateLoss(terms, Math.round(terms.attachmentGbp + terms.limitGbp * 0.45), "Loss in treaty layer"),
    evaluateLoss(terms, Math.round(terms.attachmentGbp + terms.limitGbp * 1.25), "Loss above limit")
  ];

  const narrative = [
    `This ${terms.treatyType} structure covers ${terms.subjectBusiness} across ${terms.territory}.`,
    `The cedant retains the first GBP ${terms.attachmentGbp.toLocaleString("en-GB")} per qualifying loss.`,
    `The treaty responds up to GBP ${terms.limitGbp.toLocaleString("en-GB")} with signed share ${terms.signedSharePct.toFixed(1)}%.`,
    `Ceding commission is ${terms.cedingCommissionPct.toFixed(1)}% with ${terms.reinstatements} reinstatement(s).`
  ];

  const warnings = buildWarnings(terms);
  const commentary = `${
    warnings.length > 0 ? `${warnings.length} structure warning(s) detected.` : "Structure checks passed."
  } Layer stack and loss walkthrough are ready for reviewer sign-off.`;

  const insight: TreatyInsight = {
    terms,
    layerBands,
    scenarios,
    warnings,
    narrative,
    queryHits: [],
    commentary
  };

  insight.queryHits = buildQueryHits(insight, question);

  return { missing, insight };
}

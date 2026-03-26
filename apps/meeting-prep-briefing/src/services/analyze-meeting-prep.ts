import type {
  AgendaItem,
  MarketContext,
  MeetingPrepInsight,
  Severity,
  TalkingPoint,
  UwPositionRecommendation
} from "@/types/meeting-prep";

const requiredFields = ["CLIENT", "MEETING DATE", "OBJECTIVE", "RISKS", "OPEN ITEMS", "STAKEHOLDERS"] as const;

const optionalFields = [
  "BROKER",
  "LINE OF BUSINESS",
  "PREMIUM",
  "LOSS RATIO",
  "LIMIT",
  "DEDUCTIBLE",
  "MARKET CONDITIONS",
  "DECISION DEADLINE"
] as const;

const highRiskTokens = [
  "sanctions",
  "unresolved",
  "breach",
  "urgent",
  "escalat",
  "burning cost",
  "loss ratio",
  "aggregate",
  "pml",
  "eml",
  "refer",
  "referral",
  "exceed authority",
  "excess of line",
  "facultative",
  "recall",
  "theft",
  "fraud",
  "dispute",
  "total loss",
  "constructive total loss",
  "ctl",
  "late declaration",
  "bordereau overdue",
  "cedant default"
];

const mediumRiskTokens = [
  "delay",
  "dependency",
  "remediation",
  "monitor",
  "follow-up",
  "lta",
  "long-term agreement",
  "hardening",
  "softening",
  "deductible change",
  "limit reduction",
  "capacity constraint",
  "co-insurance",
  "line change",
  "premium movement",
  "claims development",
  "reserve",
  "ibnr",
  "adjustment clause"
];

function parseKeyValueLines(briefingText: string): Record<string, string> {
  const entries = briefingText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawKey, ...rest] = line.split(":");
      return {
        key: rawKey?.trim().toUpperCase() ?? "",
        value: rest.join(":").trim()
      };
    })
    .filter((item) => item.key.length > 0);

  return Object.fromEntries(entries.map((item) => [item.key, item.value]));
}

function severityFromText(text: string): Severity {
  const lower = text.toLowerCase();
  if (highRiskTokens.some((token) => lower.includes(token))) return "high";
  if (mediumRiskTokens.some((token) => lower.includes(token))) return "medium";
  return "low";
}

function tokenizeQuestion(question: string | undefined): string[] {
  return (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function deriveMarketContext(text: string): MarketContext {
  const lower = text.toLowerCase();
  if (lower.includes("hardening") || lower.includes("rate increase") || lower.includes("capacity tightening")) {
    return "hardening";
  }
  if (lower.includes("softening") || lower.includes("rate reduction") || lower.includes("increased capacity")) {
    return "softening";
  }
  if (lower.includes("stable") || lower.includes("flat renewal") || lower.includes("unchanged terms")) {
    return "stable";
  }
  return "unknown";
}

function deriveUwPosition(
  fullTextLower: string,
  highRiskCount: number,
  openQuestionCount: number
): UwPositionRecommendation {
  if (highRiskCount >= 3) {
    return {
      position: "decline",
      rationale: "Multiple high-severity risk signals exceed acceptable threshold for this meeting."
    };
  }

  if (fullTextLower.includes("sanctions") || fullTextLower.includes("fraud")) {
    return {
      position: "refer",
      rationale: "Sanctions or fraud indicators require referral to compliance and senior underwriting authority."
    };
  }

  if (
    fullTextLower.includes("refer") ||
    fullTextLower.includes("exceed authority") ||
    fullTextLower.includes("pml") ||
    fullTextLower.includes("eml")
  ) {
    return {
      position: "refer",
      rationale: "Exposure signals or authority limits indicate this case needs a referral sign-off before commitment."
    };
  }

  if (highRiskCount >= 1 || openQuestionCount > 2) {
    return {
      position: "negotiate",
      rationale: "Risk cues and open items suggest terms are negotiable but commitment is conditional on resolution."
    };
  }

  return {
    position: "hold",
    rationale:
      "Briefing is complete and risk posture is within normal parameters. Hold current terms pending meeting outcome."
  };
}

function buildAgenda(parsed: Record<string, string>, riskCues: string[], openQuestions: string[]): AgendaItem[] {
  const risksLower = (parsed["RISKS"] ?? "").toLowerCase();
  const hasClaimsContext =
    Boolean(parsed["LOSS RATIO"] || parsed["CLAIMS HISTORY"]) ||
    risksLower.includes("loss") ||
    risksLower.includes("claim") ||
    risksLower.includes("reserve");
  const hasCapacityContext =
    Boolean(parsed["LIMIT"]) || risksLower.includes("capacity") || risksLower.includes("limit") || risksLower.includes("pml") || risksLower.includes("eml");

  const draft: Array<Omit<AgendaItem, "order">> = [
    { item: "Introductions and context", note: "Confirm attendees against stakeholder map." },
    { item: "Review of meeting objective", note: parsed["OBJECTIVE"] || "Objective not stated." }
  ];

  if (hasClaimsContext) {
    draft.push({
      item: "Claims and loss history",
      note:
        parsed["LOSS RATIO"] ||
        parsed["CLAIMS HISTORY"] ||
        "Loss ratio / claims history not provided — request before meeting."
    });
  }

  if (riskCues.length > 0) {
    draft.push({ item: "Risk cue review", note: "Walk through extracted risk cues in severity order." });
  }

  if (openQuestions.length > 0) {
    draft.push({ item: "Open items resolution", note: openQuestions[0] || "Open items not stated." });
  }

  draft.push({
    item: "Premium and terms discussion",
    note: parsed["PREMIUM"] || "Premium details not provided — confirm prior year and proposed movement."
  });

  if (hasCapacityContext) {
    draft.push({
      item: "Capacity and limit position",
      note: parsed["LIMIT"] || "Limit not specified — confirm with market before commitment."
    });
  }

  draft.push({
    item: "Decision and next steps",
    note: parsed["DECISION DEADLINE"] || "Deadline not stated — agree at meeting close."
  });

  return draft.map((item, index) => ({ order: index + 1, ...item }));
}

function meetingDateLooksUrgent(deadline: string, meetingDate: string): boolean {
  if (!deadline || !meetingDate) return false;
  if (deadline.slice(0, 8) === meetingDate.slice(0, 8)) return true;
  return deadline.slice(0, 7) === meetingDate.slice(0, 7);
}

export function analyzeMeetingPrep(briefingText: string, question?: string): {
  missing: string[];
  insight: MeetingPrepInsight;
} {
  const parsed = parseKeyValueLines(briefingText);
  const missing = requiredFields.filter((field) => !parsed[field]);

  const risks = parsed["RISKS"] ?? "";
  const openItems = parsed["OPEN ITEMS"] ?? "";
  const stakeholders = (parsed["STAKEHOLDERS"] ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const riskSentences = risks
    .split(/[.;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const openQuestionList = openItems
    .split(/[.;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const lossText = parsed["LOSS RATIO"] || parsed["CLAIMS HISTORY"] || "";
  const lowerLossText = lossText.toLowerCase();
  let lossSeverity: Severity = "medium";
  if (lowerLossText.includes("adverse") || lowerLossText.includes("deteriorat") || lowerLossText.includes("above benchmark")) {
    lossSeverity = "high";
  } else if (lowerLossText.includes("stable") || lowerLossText.includes("below") || lowerLossText.includes("nil claims")) {
    lossSeverity = "low";
  }

  const deadlineText = parsed["DECISION DEADLINE"] || "Decision deadline not provided.";
  const deadlineSeverity: Severity =
    meetingDateLooksUrgent(parsed["DECISION DEADLINE"] ?? "", parsed["MEETING DATE"] ?? "") ? "high" : "low";

  const talkingPoints: TalkingPoint[] = [
    {
      title: "Meeting objective",
      message: parsed["OBJECTIVE"] || "Objective not provided.",
      severity: "low"
    },
    {
      title: "Premium and pricing position",
      message:
        parsed["PREMIUM"] ||
        "Premium details not provided — request prior year and proposed movement from broker.",
      severity: severityFromText(parsed["PREMIUM"] ?? "")
    },
    {
      title: "Loss ratio and claims posture",
      message: lossText || "No loss data in briefing — obtain before meeting.",
      severity: lossSeverity
    },
    {
      title: "Primary risk posture",
      message: risks || "Risk narrative missing.",
      severity: severityFromText(risks)
    },
    {
      title: "Capacity and limit position",
      message: parsed["LIMIT"] || "Limit and capacity not stated — confirm EML/PML before commitment.",
      severity: severityFromText(parsed["LIMIT"] ?? "")
    },
    {
      title: "Decision timeline and authority",
      message: deadlineText,
      severity: deadlineSeverity
    }
  ];

  const warnings: string[] = [];
  if (missing.length > 0) {
    warnings.push(`Missing required briefing fields: ${missing.join(", ")}.`);
  }
  if (briefingText.trim().length < 180) {
    warnings.push("Briefing text is short; meeting pack confidence is reduced.");
  }

  const highRiskCount = riskSentences.filter((item) => severityFromText(item) === "high").length;
  const briefingReadiness: "ready" | "needs_follow_up" = missing.length === 0 ? "ready" : "needs_follow_up";

  const queryTokens = tokenizeQuestion(question);
  const queryHits = queryTokens.length
    ? briefingText
        .split(/\n+/)
        .filter((line) => queryTokens.some((token) => line.toLowerCase().includes(token)))
        .slice(0, 5)
    : [];

  const whitespaceRows: MeetingPrepInsight["whitespaceRows"] = [
    { fieldWording: "Client", extractedValue: parsed["CLIENT"] ?? "", status: parsed["CLIENT"] ? "EXTRACTED" : "MISSING" },
    { fieldWording: "Meeting date", extractedValue: parsed["MEETING DATE"] ?? "", status: parsed["MEETING DATE"] ? "EXTRACTED" : "MISSING" },
    { fieldWording: "Objective", extractedValue: parsed["OBJECTIVE"] ?? "", status: parsed["OBJECTIVE"] ? "EXTRACTED" : "MISSING" },
    { fieldWording: "Broker", extractedValue: parsed["BROKER"] ?? "", status: parsed["BROKER"] ? "EXTRACTED" : "MISSING" },
    {
      fieldWording: "Line of business",
      extractedValue: parsed["LINE OF BUSINESS"] ?? "",
      status: parsed["LINE OF BUSINESS"] ? "EXTRACTED" : "MISSING"
    },
    { fieldWording: "Premium", extractedValue: parsed["PREMIUM"] ?? "", status: parsed["PREMIUM"] ? "EXTRACTED" : "MISSING" },
    { fieldWording: "Loss ratio", extractedValue: parsed["LOSS RATIO"] ?? "", status: parsed["LOSS RATIO"] ? "EXTRACTED" : "MISSING" },
    {
      fieldWording: "Limit / capacity",
      extractedValue: parsed["LIMIT"] ?? "",
      status: parsed["LIMIT"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Deductible / excess",
      extractedValue: parsed["DEDUCTIBLE"] ?? "",
      status: parsed["DEDUCTIBLE"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Open items",
      extractedValue: openQuestionList.join(" | "),
      status: openQuestionList.length > 0 ? "EXTRACTED" : "MISSING"
    }
  ];

  const fullTextLower = briefingText.toLowerCase();
  const uwPosition = deriveUwPosition(fullTextLower, highRiskCount, openQuestionList.length);
  const agenda = buildAgenda(parsed, riskSentences, openQuestionList);
  const marketContext = deriveMarketContext(briefingText);
  const optionalExtractedCount = optionalFields.filter((field) => Boolean(parsed[field])).length;

  return {
    missing: [...missing],
    insight: {
      summary: {
        briefingReadiness,
        highRiskCount,
        openQuestions: openQuestionList.length,
        stakeholdersMentioned: stakeholders.length
      },
      contextOverview: [
        `Client: ${parsed["CLIENT"] || "Not provided"}`,
        `Objective: ${parsed["OBJECTIVE"] || "Not provided"}`,
        `Meeting date: ${parsed["MEETING DATE"] || "Not provided"}`,
        `Optional briefing depth: ${optionalExtractedCount}/${optionalFields.length} optional fields present`
      ],
      stakeholderMap: stakeholders,
      riskCues: riskSentences,
      talkingPoints,
      openQuestions: openQuestionList,
      queryHits,
      warnings,
      whitespaceRows,
      uwPosition,
      agenda,
      marketContext
    }
  };
}

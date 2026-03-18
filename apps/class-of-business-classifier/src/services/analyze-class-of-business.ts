import type {
  CobCandidate,
  CobCommentary,
  CobInsight,
  CobLabel,
  CobWarning,
  ConfidenceBand,
  KeywordSignal,
  QueryHit
} from "@/types/class-of-business";

interface SignalRule {
  keyword: string;
  rationale: string;
  pattern: RegExp;
  weight: number;
}

const labelRules: Record<CobLabel, SignalRule[]> = {
  Property: [
    { keyword: "property damage", rationale: "Property indemnity language", pattern: /\bproperty damage\b/i, weight: 1.4 },
    { keyword: "buildings", rationale: "Real-estate asset signal", pattern: /\b(buildings?|premises?)\b/i, weight: 1.1 },
    { keyword: "sum insured", rationale: "Property schedule pattern", pattern: /\bsum insured\b/i, weight: 1.2 },
    { keyword: "business interruption", rationale: "Property BI extension", pattern: /\bbusiness interruption\b/i, weight: 1.4 }
  ],
  "Marine Cargo": [
    { keyword: "cargo", rationale: "Cargo transit risk", pattern: /\bcargo\b/i, weight: 1.5 },
    { keyword: "transit", rationale: "Goods-in-transit language", pattern: /\btransit\b/i, weight: 1.3 },
    { keyword: "bill of lading", rationale: "Marine document cue", pattern: /\bbill of lading\b/i, weight: 1.6 },
    { keyword: "freight forwarder", rationale: "Logistics shipment signal", pattern: /\bfreight forwarder\b/i, weight: 1.4 }
  ],
  "Casualty / Liability": [
    { keyword: "public liability", rationale: "Liability class marker", pattern: /\bpublic liability\b/i, weight: 1.5 },
    { keyword: "products liability", rationale: "Liability extension marker", pattern: /\bproducts? liability\b/i, weight: 1.4 },
    { keyword: "third party injury", rationale: "Casualty claims signal", pattern: /\bthird[- ]party\b.*\b(injury|damage)\b/i, weight: 1.2 },
    { keyword: "indemnity", rationale: "General liability wording", pattern: /\bindemnity\b/i, weight: 1.0 }
  ],
  Cyber: [
    { keyword: "ransomware", rationale: "Cyber extortion signal", pattern: /\bransomware\b/i, weight: 1.7 },
    { keyword: "data breach", rationale: "Privacy breach signal", pattern: /\bdata breach\b/i, weight: 1.6 },
    { keyword: "network interruption", rationale: "Cyber BI signal", pattern: /\bnetwork interruption\b/i, weight: 1.5 },
    { keyword: "incident response", rationale: "Cyber response service", pattern: /\bincident response\b/i, weight: 1.2 }
  ],
  "Financial Lines": [
    { keyword: "directors and officers", rationale: "D&O marker", pattern: /\bdirectors?\s+and\s+officers?\b|\bd&o\b/i, weight: 1.6 },
    { keyword: "professional indemnity", rationale: "PI class marker", pattern: /\bprofessional indemnity\b|\bprofessional liability\b/i, weight: 1.5 },
    { keyword: "crime", rationale: "Financial crime wording", pattern: /\b(fidelity|crime cover|employee dishonesty)\b/i, weight: 1.3 },
    { keyword: "fiduciary", rationale: "Financial lines extension", pattern: /\bfiduciary\b/i, weight: 1.1 }
  ],
  Aviation: [
    { keyword: "aircraft", rationale: "Aviation asset signal", pattern: /\baircraft\b/i, weight: 1.7 },
    { keyword: "hull", rationale: "Aviation hull signal", pattern: /\bhull\b/i, weight: 1.4 },
    { keyword: "grounding", rationale: "Aviation operation cue", pattern: /\bground handling\b|\bhangar\b/i, weight: 1.2 },
    { keyword: "aviation liability", rationale: "Aviation liability marker", pattern: /\baviation liability\b/i, weight: 1.6 }
  ],
  Energy: [
    { keyword: "upstream", rationale: "Energy sector marker", pattern: /\bupstream\b|\bdownstream\b/i, weight: 1.4 },
    { keyword: "offshore", rationale: "Offshore operations signal", pattern: /\boffshore\b/i, weight: 1.5 },
    { keyword: "refinery", rationale: "Energy infrastructure cue", pattern: /\brefiner(y|ies)\b|\bpetrochemical\b/i, weight: 1.4 },
    { keyword: "well control", rationale: "Energy specialist term", pattern: /\bwell control\b/i, weight: 1.6 }
  ],
  Construction: [
    { keyword: "contract works", rationale: "Construction all risks marker", pattern: /\bcontract works\b/i, weight: 1.6 },
    { keyword: "erection all risks", rationale: "EAR marker", pattern: /\berection all risks\b|\bear\b/i, weight: 1.5 },
    { keyword: "site works", rationale: "Construction site signal", pattern: /\bconstruction site\b|\bsite works\b/i, weight: 1.3 },
    { keyword: "project delay", rationale: "Delay in start-up signal", pattern: /\bdelay in start[- ]up\b|\bdsu\b/i, weight: 1.2 }
  ],
  "Accident & Health": [
    { keyword: "personal accident", rationale: "A&H marker", pattern: /\bpersonal accident\b/i, weight: 1.6 },
    { keyword: "medical expenses", rationale: "Health coverage cue", pattern: /\bmedical expenses\b/i, weight: 1.3 },
    { keyword: "group life", rationale: "Employee benefits cue", pattern: /\bgroup life\b/i, weight: 1.2 },
    { keyword: "temporary total disablement", rationale: "A&H claims term", pattern: /\btemporary total disablement\b|\bttd\b/i, weight: 1.4 }
  ],
  "Specialty Other": []
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function bandFor(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) {
    return "high";
  }
  if (confidence >= 0.6) {
    return "medium";
  }
  return "low";
}

function normalizeConfidence(raw: number, sum: number): number {
  if (sum <= 0) {
    return 0;
  }
  return Number((raw / sum).toFixed(2));
}

function buildQueryHits(riskText: string, question?: string | null): QueryHit[] {
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

  const snippets = riskText
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter(Boolean)
    .filter((line) => tokens.some((token) => line.toLowerCase().includes(token)))
    .slice(0, 5);

  return snippets.map((snippet) => ({ fieldName: "risk_text", snippet }));
}

function buildCommentary(top: CobCandidate, warnings: CobWarning[], totalSignals: number): CobCommentary {
  const observations = [
    `Top class candidate: ${top.label} (${Math.round(top.confidence * 100)}% confidence).`,
    `Matched ${totalSignals} weighted signal(s) across the taxonomy.`,
    `Confidence band assessed as ${top.confidenceBand}.`
  ];

  if (warnings.length > 0) {
    observations.push(`Warning count: ${warnings.length}.`);
  }

  const actions = [
    warnings.some((warning) => warning.code === "low_confidence")
      ? "Route to referral review and request a fuller risk narrative."
      : "Proceed with standard underwriting review for the suggested class.",
    warnings.some((warning) => warning.code === "ambiguous_classification")
      ? "Validate class choice manually because top candidates are close."
      : "Use the top class and keep alternatives as secondary options."
  ];

  return {
    executiveSummary: `${top.label} selected as top class with ${Math.round(top.confidence * 100)}% confidence and ${warnings.length} warning(s).`,
    observations,
    actions
  };
}

export function buildClassOfBusinessInsight(riskText: string, question?: string | null): CobInsight {
  const signals: KeywordSignal[] = [];

  (Object.keys(labelRules) as CobLabel[]).forEach((label) => {
    for (const rule of labelRules[label]) {
      const match = riskText.match(rule.pattern);
      if (!match) {
        continue;
      }

      signals.push({
        label,
        keyword: rule.keyword,
        weight: rule.weight,
        snippet: compact(match[0]),
        rationale: rule.rationale
      });
    }
  });

  const scores = new Map<CobLabel, number>();
  (Object.keys(labelRules) as CobLabel[]).forEach((label) => {
    scores.set(label, 0);
  });

  for (const signal of signals) {
    scores.set(signal.label, (scores.get(signal.label) ?? 0) + signal.weight);
  }

  if (signals.length === 0) {
    const warnings: CobWarning[] = [
      {
        code: "low_confidence",
        message: "Top class confidence is below 60%; referral review recommended."
      },
      {
        code: "sparse_signals",
        message: "Very few class signals were found in the input text."
      }
    ];

    const fallbackTop: CobCandidate = {
      label: "Specialty Other",
      confidence: 0.35,
      confidenceBand: "low",
      reasoning: "No taxonomy signals detected.",
      matchedSignals: []
    };

    return {
      summary: {
        topLabel: fallbackTop.label,
        topConfidence: fallbackTop.confidence,
        confidenceBand: fallbackTop.confidenceBand,
        ambiguous: false,
        candidateCount: 1,
        totalSignals: 0
      },
      candidates: [fallbackTop],
      keywordSignals: [],
      warnings,
      commentary: buildCommentary(fallbackTop, warnings, 0),
      query: {
        question: question ?? null,
        hits: buildQueryHits(riskText, question)
      }
    };
  }

  const scoreEntries = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const positiveEntries = scoreEntries.filter((entry) => entry[1] > 0);
  const scoreSum = positiveEntries.reduce((sum, entry) => sum + entry[1], 0);

  const candidates: CobCandidate[] = positiveEntries.slice(0, 4).map(([label, score]) => {
    const confidence = normalizeConfidence(score, scoreSum);
    const matchedSignals = signals
      .filter((signal) => signal.label === label)
      .map((signal) => signal.keyword);

    const reasoning =
      matchedSignals.length > 0
        ? `Signals matched: ${matchedSignals.join(", ")}.`
        : "No direct signals matched; fallback candidate.";

    return {
      label,
      confidence,
      confidenceBand: bandFor(confidence),
      reasoning,
      matchedSignals
    };
  });

  const top = candidates[0] ?? {
    label: "Specialty Other",
    confidence: 0.35,
    confidenceBand: "low" as ConfidenceBand,
    reasoning: "No taxonomy signals detected.",
    matchedSignals: []
  };

  const second = candidates[1];
  const ambiguous = second ? top.confidence - second.confidence < 0.08 : false;

  const warnings: CobWarning[] = [];

  if (top.confidence < 0.6) {
    warnings.push({
      code: "low_confidence",
      message: "Top class confidence is below 60%; referral review recommended."
    });
  }

  if (ambiguous) {
    warnings.push({
      code: "ambiguous_classification",
      message: "Top two class candidates are close; classification is ambiguous."
    });
  }

  if (signals.length < 2) {
    warnings.push({
      code: "sparse_signals",
      message: "Very few class signals were found in the input text."
    });
  }

  return {
    summary: {
      topLabel: top.label,
      topConfidence: top.confidence,
      confidenceBand: top.confidenceBand,
      ambiguous,
      candidateCount: candidates.length,
      totalSignals: signals.length
    },
    candidates,
    keywordSignals: signals,
    warnings,
    commentary: buildCommentary(top, warnings, signals.length),
    query: {
      question: question ?? null,
      hits: buildQueryHits(riskText, question)
    }
  };
}

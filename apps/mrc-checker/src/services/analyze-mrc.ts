import type {
  ClauseCheck,
  FieldCheck,
  MrcInsight,
  MrcStructuredData,
  QueryHit
} from "@/types/mrc-checker";

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractLine(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1];
    if (value) {
      return compact(value);
    }
  }
  return null;
}

function extractDateRange(text: string): { inceptionDate: string | null; expiryDate: string | null } {
  const periodMatch = text.match(
    /(?:PERIOD|POLICY PERIOD)\s*:\s*(?:FROM\s*)?([0-9]{1,2}[\s/-][A-Za-z]{3,9}[\s/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})\s*(?:TO|-)\s*([0-9]{1,2}[\s/-][A-Za-z]{3,9}[\s/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i
  );

  if (!periodMatch) {
    return { expiryDate: null, inceptionDate: null };
  }

  return {
    expiryDate: compact(periodMatch[2] ?? ""),
    inceptionDate: compact(periodMatch[1] ?? "")
  };
}

function parseSubjectivities(text: string): { cleared: boolean; lines: string[] } {
  const blockMatch = text.match(/SUBJECTIVITIES?\s*:\s*([\s\S]*?)(?:\n[A-Z][A-Z -]{2,}:|$)/i);
  const raw = compact(blockMatch?.[1] ?? "");
  if (!raw) {
    return { cleared: false, lines: [] };
  }
  if (/^none\b/i.test(raw)) {
    return { cleared: true, lines: [] };
  }

  const lines = raw
    .split(/\n|;|•|- /)
    .map((line) => compact(line))
    .filter(Boolean);
  return { cleared: false, lines };
}

function parseClauseMentions(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter((line) => /clause|endorsement|lma[0-9]{3,}/i.test(line));
  return [...new Set(lines)].slice(0, 15);
}

function buildStructuredData(mrcText: string): MrcStructuredData {
  const dates = extractDateRange(mrcText);
  const subjectivities = parseSubjectivities(mrcText);

  return {
    broker: extractLine(mrcText, [/BROKER\s*:\s*(.+)/i]),
    claimsNotification: extractLine(mrcText, [
      /NOTIFICATION OF CLAIMS TO\s*:\s*(.+)/i,
      /CLAIMS NOTIFICATION\s*:\s*(.+)/i
    ]),
    contractType: extractLine(mrcText, [/TYPE\s*:\s*(.+)/i, /CONTRACT TYPE\s*:\s*(.+)/i]),
    currency: extractLine(mrcText, [/CURRENCY\s*:\s*([A-Z]{3})/i]),
    expiryDate: dates.expiryDate,
    governingLaw: extractLine(mrcText, [/CHOICE OF LAW\s*:\s*(.+)/i, /GOVERNING LAW\s*:\s*(.+)/i]),
    inceptionDate: dates.inceptionDate,
    insuredName: extractLine(mrcText, [/INSURED\s*:\s*(.+)/i]),
    interest: extractLine(mrcText, [/INTEREST\s*:\s*(.+)/i]),
    jurisdiction: extractLine(mrcText, [/CHOICE OF JURISDICTION\s*:\s*(.+)/i, /JURISDICTION\s*:\s*(.+)/i]),
    limit: extractLine(mrcText, [/LIMIT OF LIABILITY\s*:\s*(.+)/i, /LIMIT\s*:\s*(.+)/i]),
    notableClauseMentions: parseClauseMentions(mrcText),
    premiumPaymentTerms: extractLine(mrcText, [/PAYMENT TERMS\s*:\s*(.+)/i, /PREMIUM PAYMENT\s*:\s*(.+)/i]),
    retention: extractLine(mrcText, [/RETENTION\s*:\s*(.+)/i, /DEDUCTIBLE\s*:\s*(.+)/i]),
    subjectivities: subjectivities.lines,
    subjectivitiesExplicitlyCleared: subjectivities.cleared,
    territory: extractLine(mrcText, [/TERRITORIAL(?:\s+LIMITS)?\s*:\s*(.+)/i, /TERRITORY\s*:\s*(.+)/i]),
    uniqueMarketReference: extractLine(mrcText, [/UNIQUE MARKET REFERENCE\s*:\s*(.+)/i, /UMR\s*:\s*(.+)/i])
  };
}

function fieldStatus(
  label: string,
  value: string | null,
  required: boolean,
  rationaleWhenMissing: string
): FieldCheck {
  if (value) {
    return {
      evidence: value,
      extractedValue: value,
      fieldKey: label.toLowerCase().replace(/\s+/g, "_"),
      label,
      rationale: "Detected in source wording.",
      required,
      status: "matched"
    };
  }

  return {
    evidence: null,
    extractedValue: null,
    fieldKey: label.toLowerCase().replace(/\s+/g, "_"),
    label,
    rationale: rationaleWhenMissing,
    required,
    status: required ? "missing" : "attention"
  };
}

function clauseStatus(label: string, text: string, required = true): ClauseCheck {
  const pattern = label
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const match = text.match(new RegExp(`(${pattern})`, "i"));

  if (match) {
    return {
      clauseKey: label.toLowerCase().replace(/\s+/g, "_"),
      label,
      rationale: "Clause wording identified in source text.",
      snippet: compact(match[1] ?? ""),
      status: "present"
    };
  }

  return {
    clauseKey: label.toLowerCase().replace(/\s+/g, "_"),
    label,
    rationale: required
      ? "No explicit evidence found for this commonly expected clause."
      : "Clause not explicitly referenced in the extract.",
    snippet: null,
    status: required ? "missing" : "attention"
  };
}

function findQueryHits(text: string, question?: string): QueryHit[] {
  if (!question?.trim()) {
    return [];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter(Boolean);

  const tokens = question
    .toLowerCase()
    .split(/\W+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (tokens.length === 0) {
    return [];
  }

  const hits: QueryHit[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!tokens.some((token) => lower.includes(token))) {
      continue;
    }

    let section = "Wording";
    if (/subjectivit/i.test(line)) {
      section = "Subjectivities";
    } else if (/law|jurisdiction/i.test(line)) {
      section = "Legal";
    } else if (/limit|retention|deductible|currency/i.test(line)) {
      section = "Financial terms";
    }

    hits.push({
      label: section,
      section,
      snippet: line
    });
    if (hits.length >= 8) {
      break;
    }
  }
  return hits;
}

export function analyzeMrcText(mrcText: string, question?: string): MrcInsight {
  const text = mrcText.replace(/\r/g, "");
  const structuredData = buildStructuredData(text);

  const fieldChecks: FieldCheck[] = [
    fieldStatus("Unique Market Reference", structuredData.uniqueMarketReference, true, "Missing UMR reference."),
    fieldStatus("Insured", structuredData.insuredName, true, "Missing insured details."),
    fieldStatus("Broker", structuredData.broker, true, "Missing broker details."),
    fieldStatus("Interest", structuredData.interest, true, "Missing risk interest description."),
    fieldStatus("Territory", structuredData.territory, true, "Missing territorial scope."),
    fieldStatus("Limit", structuredData.limit, true, "Missing limit of liability."),
    fieldStatus("Retention", structuredData.retention, true, "Missing retention / deductible."),
    fieldStatus("Claims Notification", structuredData.claimsNotification, true, "Missing claims notification instruction."),
    fieldStatus("Premium Payment Terms", structuredData.premiumPaymentTerms, false, "Payment terms not explicit."),
    fieldStatus("Governing Law", structuredData.governingLaw, false, "Governing law not explicit."),
    fieldStatus("Jurisdiction", structuredData.jurisdiction, false, "Jurisdiction not explicit.")
  ];

  const clauseChecks: ClauseCheck[] = [
    clauseStatus("Sanction Limitation and Exclusion Clause", text),
    clauseStatus("War and Cyber Operation Exclusion", text),
    clauseStatus("Claims Cooperation Clause", text, false),
    clauseStatus("Premium Payment Clause", text, false)
  ];

  const missingRequiredFields = fieldChecks.filter((field) => field.required && field.status !== "matched");
  const attentionFields = fieldChecks.filter((field) => field.status === "attention");
  const warnings: MrcInsight["warnings"] = [];
  const referrals: MrcInsight["referrals"] = [];

  if (!structuredData.subjectivitiesExplicitlyCleared && structuredData.subjectivities.length > 0) {
    warnings.push({
      action: "Confirm completion owners and dates before sign-off.",
      rationale: `${structuredData.subjectivities.length} subjectivity item(s) remain open.`,
      relatedKeys: ["subjectivities"],
      severity: "warning",
      snippet: structuredData.subjectivities[0] ?? null,
      title: "Outstanding subjectivities"
    });
  }

  const missingCoreClauses = clauseChecks.filter((clause) => clause.status === "missing");
  if (missingCoreClauses.length > 0) {
    referrals.push({
      action: "Escalate to wordings review to confirm whether omitted clauses are intentional.",
      rationale: `${missingCoreClauses.length} expected clause(s) are not evidenced in the extract.`,
      relatedKeys: missingCoreClauses.map((clause) => clause.clauseKey),
      severity: "referral",
      snippet: null,
      title: "Core clause coverage gap"
    });
  }

  if (!structuredData.governingLaw || !/england|wales|english/i.test(structuredData.governingLaw)) {
    warnings.push({
      action: "Confirm governing law alignment with market requirements.",
      rationale: "Governing law is absent or outside the expected London market baseline.",
      relatedKeys: ["governing_law"],
      severity: "warning",
      snippet: structuredData.governingLaw,
      title: "Governing law needs review"
    });
  }

  const matchedFields = fieldChecks.filter((field) => field.status === "matched").length;
  const fieldCoverage = Math.round((matchedFields / fieldChecks.length) * 100);
  const gatePassed = missingRequiredFields.length === 0;

  return {
    clauseChecks,
    commentary: {
      actions: [
        gatePassed ? "Required MRC fields are present for reviewer progression." : "Fix required-field gaps before progressing.",
        missingCoreClauses.length > 0
          ? "Validate omitted core clauses with wordings counsel."
          : "Core clause set appears present for initial review.",
        warnings.length > 0
          ? "Resolve warning items and capture disposition in reviewer notes."
          : "No warning items detected in this deterministic pass."
      ],
      executiveSummary: gatePassed
        ? `MRC gate passed with ${fieldCoverage}% field coverage and ${referrals.length} referral(s).`
        : `MRC gate failed: ${missingRequiredFields.length} required field(s) missing and ${referrals.length} referral(s).`,
      observations: [
        `${matchedFields}/${fieldChecks.length} fields were extracted deterministically.`,
        `${clauseChecks.filter((clause) => clause.status === "present").length}/${clauseChecks.length} clause checks are present.`,
        `${structuredData.subjectivities.length} subjectivity item(s) were captured.`
      ]
    },
    fieldChecks,
    query: {
      hits: findQueryHits(text, question),
      question: question ?? null
    },
    referrals,
    structuredData,
    summary: {
      attentionFields: attentionFields.length,
      clauseAttentionCount: clauseChecks.filter((clause) => clause.status !== "present").length,
      fieldCoverage,
      gatePassed,
      matchedFields,
      missingFields: missingRequiredFields.length,
      missingRequiredFields: missingRequiredFields.map((field) => field.label),
      referralCount: referrals.length,
      requiredFieldCount: fieldChecks.filter((field) => field.required).length,
      warningCount: warnings.length
    },
    warnings
  };
}

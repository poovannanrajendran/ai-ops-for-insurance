import type {
  ClaimsLeakageInsight,
  ClaimsRow,
  LeakageFinding,
  LeakageFlag,
  RuleCount
} from "@/types/claims-leakage";

const requiredHeaders = [
  "claim_id",
  "policy_id",
  "claimant_name",
  "cause_of_loss",
  "loss_date",
  "notified_date",
  "reserve_gbp",
  "incurred_gbp",
  "paid_gbp",
  "status"
] as const;

interface ParseResult {
  rows: ClaimsRow[];
  errors: string[];
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function dayDiff(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff)) {
    return 0;
  }
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function parseClaimsCsv(claimsText: string): ParseResult {
  const lines = claimsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) {
    return { rows: [], errors: ["Provide at least one header row and three data rows."] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}.`] };
  }

  const rows: ClaimsRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));
    const rowNumber = lineIndex + 1;

    const reserveGbp = Number((record.reserve_gbp ?? "").replace(/,/g, ""));
    const incurredGbp = Number((record.incurred_gbp ?? "").replace(/,/g, ""));
    const paidGbp = Number((record.paid_gbp ?? "").replace(/,/g, ""));

    const row: ClaimsRow = {
      claimId: (record.claim_id ?? "").trim(),
      policyId: (record.policy_id ?? "").trim(),
      claimantName: (record.claimant_name ?? "").trim(),
      causeOfLoss: (record.cause_of_loss ?? "").trim(),
      lossDate: (record.loss_date ?? "").trim(),
      notifiedDate: (record.notified_date ?? "").trim(),
      reserveGbp,
      incurredGbp,
      paidGbp,
      status: (record.status ?? "").trim()
    };

    const invalid =
      !row.claimId ||
      !row.policyId ||
      !row.claimantName ||
      !row.causeOfLoss ||
      !row.lossDate ||
      !row.notifiedDate ||
      !row.status ||
      Number.isNaN(row.reserveGbp) ||
      Number.isNaN(row.incurredGbp) ||
      Number.isNaN(row.paidGbp);

    if (invalid) {
      errors.push(`Row ${rowNumber} has invalid required values.`);
      continue;
    }

    rows.push(row);
  }

  return { rows, errors };
}

function flagsForClaim(row: ClaimsRow, rows: ClaimsRow[]): LeakageFlag[] {
  const flags: LeakageFlag[] = [];
  const notificationLag = dayDiff(row.lossDate, row.notifiedDate);

  if (notificationLag > 30) {
    flags.push({
      code: "late_notification",
      score: 25,
      message: `Notification lag is ${notificationLag} days, above expected reporting window.`
    });
  }

  if (row.reserveGbp > 0 && row.incurredGbp > row.reserveGbp * 1.2) {
    flags.push({
      code: "reserve_inadequacy",
      score: 30,
      message: "Incurred value exceeds reserve by more than 20%; reserve adequacy review recommended."
    });
  }

  const duplicates = rows.filter(
    (candidate) =>
      candidate.claimId !== row.claimId &&
      candidate.policyId === row.policyId &&
      candidate.claimantName.toLowerCase() === row.claimantName.toLowerCase() &&
      candidate.causeOfLoss.toLowerCase() === row.causeOfLoss.toLowerCase() &&
      candidate.lossDate === row.lossDate
  );
  if (duplicates.length > 0) {
    flags.push({
      code: "potential_duplicate",
      score: 35,
      message: `Potential duplicate claim pattern matched ${duplicates.length} other claim(s).`
    });
  }

  if (row.status.toLowerCase().includes("reopen")) {
    flags.push({
      code: "reopened_claim",
      score: 18,
      message: "Claim is reopened, indicating potential leakage through cycle churn."
    });
  }

  return flags;
}

function aggregateRuleCounts(findings: LeakageFinding[]): RuleCount[] {
  const map = new Map<string, number>();
  for (const finding of findings) {
    for (const flag of finding.flags) {
      map.set(flag.code, (map.get(flag.code) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((left, right) => right.count - left.count);
}

function buildQueryHits(findings: LeakageFinding[], warnings: string[], question?: string): string[] {
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

  const lines = [
    ...findings.map(
      (finding) =>
        `${finding.claimId} ${finding.claimantName} score ${finding.leakageScore} severity ${finding.severity}`
    ),
    ...warnings
  ];

  const hits: string[] = [];
  for (const line of lines) {
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

export function analyzeClaimsLeakage(
  claimsText: string,
  question?: string
): { validationErrors: string[]; insight: ClaimsLeakageInsight } {
  const parsed = parseClaimsCsv(claimsText);
  if (parsed.errors.length > 0) {
    return {
      validationErrors: parsed.errors,
      insight: {
        summary: { totalClaims: 0, flaggedClaims: 0, highSeverityClaims: 0, estimatedLeakageGbp: 0 },
        findings: [],
        ruleCounts: [],
        warnings: [],
        queryHits: [],
        commentary: "Validation failed."
      }
    };
  }

  const findings: LeakageFinding[] = [];

  for (const row of parsed.rows) {
    const flags = flagsForClaim(row, parsed.rows);
    if (flags.length === 0) continue;

    const leakageScore = flags.reduce((total, flag) => total + flag.score, 0);
    findings.push({
      claimId: row.claimId,
      policyId: row.policyId,
      claimantName: row.claimantName,
      causeOfLoss: row.causeOfLoss,
      reserveGbp: row.reserveGbp,
      incurredGbp: row.incurredGbp,
      leakageScore,
      severity: leakageScore >= 50 ? "high" : "medium",
      flags
    });
  }

  findings.sort((left, right) => right.leakageScore - left.leakageScore);

  const ruleCounts = aggregateRuleCounts(findings);
  const estimatedLeakageGbp = findings.reduce((total, finding) => {
    const reserveGap = Math.max(0, finding.incurredGbp - finding.reserveGbp);
    return total + reserveGap;
  }, 0);

  const warnings: string[] = [];
  if (findings.length === 0) {
    warnings.push("No leakage indicators triggered in this run.");
  } else {
    const highSeverityClaims = findings.filter((finding) => finding.severity === "high").length;
    if (highSeverityClaims > 0) {
      warnings.push(`${highSeverityClaims} high-severity claim(s) should be prioritised for leakage review.`);
    }
    if (estimatedLeakageGbp >= 250000) {
      warnings.push(
        `Estimated reserve pressure exposure exceeds GBP ${estimatedLeakageGbp.toLocaleString("en-GB")}.`
      );
    }
  }

  const insight: ClaimsLeakageInsight = {
    summary: {
      totalClaims: parsed.rows.length,
      flaggedClaims: findings.length,
      highSeverityClaims: findings.filter((finding) => finding.severity === "high").length,
      estimatedLeakageGbp
    },
    findings,
    ruleCounts,
    warnings,
    queryHits: [],
    commentary:
      findings.length > 0
        ? `${findings.length} claim(s) carry leakage indicators. Review high-severity cases before next reserve cycle.`
        : "No leakage indicators detected. Continue routine claims governance monitoring."
  };

  insight.queryHits = buildQueryHits(findings, warnings, question);

  return { validationErrors: [], insight };
}

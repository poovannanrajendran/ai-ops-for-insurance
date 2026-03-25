import type {
  MarketProgress,
  PlacementCommentary,
  PlacementInsight,
  PlacementRow,
  PlacementStatus,
  PriorityFlag,
  PrioritySeverity,
  StatusLane
} from "@/types/placement-tracker";

interface ParseResult {
  errors: string[];
  rows: PlacementRow[];
}

const requiredHeaders = [
  "placement_id",
  "account_name",
  "broker",
  "market_name",
  "status",
  "target_share_pct",
  "signed_share_pct",
  "quoted_share_pct",
  "line_size_gbp",
  "premium_gbp",
  "follow_up_age_days",
  "capacity_change_pct",
  "class_of_business",
  "territory"
] as const;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function round1(value: number): number {
  return Number(value.toFixed(1));
}

function normalizeStatus(value: string): PlacementStatus {
  const lowered = value.toLowerCase();

  if (/(placed|signed|bound)/.test(lowered)) {
    return "placed";
  }

  if (/(follow\s*up|follow-up|chase)/.test(lowered)) {
    return "follow-up";
  }

  if (/(quoted|quote)/.test(lowered)) {
    return "quoted";
  }

  if (/(declined|decline)/.test(lowered)) {
    return "declined";
  }

  if (/(hold|pause)/.test(lowered)) {
    return "hold";
  }

  return "open";
}

function severityRank(severity: PrioritySeverity): number {
  if (severity === "critical") {
    return 3;
  }

  if (severity === "watch") {
    return 2;
  }

  return 1;
}

export function parsePlacementCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    return {
      errors: ["Provide at least one header row and two market rows."],
      rows: []
    };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      errors: [`Missing required column(s): ${missingHeaders.join(", ")}.`],
      rows: []
    };
  }

  const rows: PlacementRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const values = splitCsvLine(lines[lineIndex]);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    const placementId = compact(record.placement_id ?? "");
    const accountName = compact(record.account_name ?? "");
    const broker = compact(record.broker ?? "");
    const marketName = compact(record.market_name ?? "");
    const rawStatus = compact(record.status ?? "");
    const classOfBusiness = compact(record.class_of_business ?? "");
    const territory = compact(record.territory ?? "");
    const targetSharePct = Number(record.target_share_pct);
    const signedSharePct = Number(record.signed_share_pct);
    const quotedSharePct = Number(record.quoted_share_pct);
    const lineSizeGbp = Number(record.line_size_gbp);
    const premiumGbp = Number(record.premium_gbp);
    const followUpAgeDays = Number(record.follow_up_age_days);
    const capacityChangePct = Number(record.capacity_change_pct);

    if (
      !placementId ||
      !accountName ||
      !broker ||
      !marketName ||
      !rawStatus ||
      !classOfBusiness ||
      !territory ||
      Number.isNaN(targetSharePct) ||
      Number.isNaN(signedSharePct) ||
      Number.isNaN(quotedSharePct) ||
      Number.isNaN(lineSizeGbp) ||
      Number.isNaN(premiumGbp) ||
      Number.isNaN(followUpAgeDays) ||
      Number.isNaN(capacityChangePct)
    ) {
      errors.push(`Row ${rowNumber} has invalid required values.`);
      continue;
    }

    if (
      targetSharePct <= 0 ||
      targetSharePct > 100 ||
      signedSharePct < 0 ||
      signedSharePct > 100 ||
      quotedSharePct < 0 ||
      quotedSharePct > 100 ||
      lineSizeGbp <= 0 ||
      premiumGbp < 0 ||
      followUpAgeDays < 0 ||
      capacityChangePct < -100 ||
      capacityChangePct > 100
    ) {
      errors.push(`Row ${rowNumber} contains out-of-range placement metrics.`);
      continue;
    }

    rows.push({
      accountName,
      broker,
      capacityChangePct,
      classOfBusiness,
      followUpAgeDays,
      lineSizeGbp,
      marketName,
      placementId,
      premiumGbp,
      quotedSharePct,
      signedSharePct,
      status: normalizeStatus(rawStatus),
      targetSharePct,
      territory
    });
  }

  return { errors, rows };
}

function buildPriorityFlags(rows: PlacementRow[]): PriorityFlag[] {
  const flags: PriorityFlag[] = [];
  const totalSigned = rows.reduce((sum, row) => sum + row.signedSharePct, 0);
  const lineSizes = [...new Set(rows.map((row) => row.lineSizeGbp))];

  for (const row of rows) {
    const projectedSharePct = Math.max(row.signedSharePct, row.quotedSharePct);
    const gapPct = Math.max(row.targetSharePct - projectedSharePct, 0);

    if (row.status !== "placed" && row.followUpAgeDays >= 5) {
      flags.push({
        code: "stale_follow_up",
        detail: `${row.marketName} has been open for ${row.followUpAgeDays} day(s) without a signed line.`,
        marketName: row.marketName,
        severity: row.followUpAgeDays >= 7 ? "critical" : "watch",
        title: "Stale follow-up"
      });
    }

    if (gapPct >= 5) {
      flags.push({
        code: "capacity_gap",
        detail: `${row.marketName} is ${round1(gapPct)} point(s) short of its target participation.`,
        marketName: row.marketName,
        severity: gapPct >= 12 ? "critical" : "watch",
        title: "Capacity gap"
      });
    }

    if (row.capacityChangePct <= -10) {
      flags.push({
        code: "shrinking_capacity",
        detail: `${row.marketName} appetite moved ${Math.abs(row.capacityChangePct)}% lower than the original ask.`,
        marketName: row.marketName,
        severity: row.capacityChangePct <= -18 ? "critical" : "watch",
        title: "Shrinking capacity"
      });
    }

    if (row.status === "declined" && row.targetSharePct >= 10) {
      flags.push({
        code: "declined_line",
        detail: `${row.marketName} declined a ${round1(row.targetSharePct)}% target line and must be replaced.`,
        marketName: row.marketName,
        severity: "critical",
        title: "Declined target line"
      });
    }
  }

  const leadMarket = [...rows].sort((left, right) => right.signedSharePct - left.signedSharePct)[0];
  if (leadMarket && totalSigned > 0 && (leadMarket.signedSharePct / totalSigned) * 100 >= 45) {
    flags.push({
      code: "lead_dependency",
      detail: `${leadMarket.marketName} carries ${round1((leadMarket.signedSharePct / totalSigned) * 100)}% of the currently placed line.`,
      marketName: leadMarket.marketName,
      severity: "watch",
      title: "Lead dependency"
    });
  }

  if (lineSizes.length > 1) {
    flags.push({
      code: "line_mismatch",
      detail: `Detected ${lineSizes.length} different line sizes in the same placement extract. Check broker source consistency.`,
      severity: "watch",
      title: "Line size mismatch"
    });
  }

  return flags.sort((left, right) => severityRank(right.severity) - severityRank(left.severity));
}

function derivePriority(row: PlacementRow, flags: PriorityFlag[]): PrioritySeverity {
  const matchingFlags = flags.filter((flag) => flag.marketName === row.marketName);
  if (matchingFlags.some((flag) => flag.severity === "critical")) {
    return "critical";
  }
  if (matchingFlags.some((flag) => flag.severity === "watch")) {
    return "watch";
  }
  if (row.status === "placed") {
    return "stable";
  }
  return row.followUpAgeDays >= 3 ? "watch" : "stable";
}

function buildStatusLanes(rows: PlacementRow[], totalTargetSharePct: number): StatusLane[] {
  const placedRows = rows.filter((row) => row.status === "placed");
  const openRows = rows.filter((row) => row.status !== "placed");

  const lane = (label: string, status: "placed" | "open", laneRows: PlacementRow[]): StatusLane => ({
    avgFollowUpAgeDays: laneRows.length === 0 ? 0 : round1(laneRows.reduce((sum, row) => sum + row.followUpAgeDays, 0) / laneRows.length),
    count: laneRows.length,
    label,
    sharePct: round1(laneRows.reduce((sum, row) => sum + row.targetSharePct, 0) / totalTargetSharePct * 100),
    status
  });

  return [lane("Placed", "placed", placedRows), lane("Open", "open", openRows)];
}

function buildCommentary(summary: PlacementInsight["summary"], flags: PriorityFlag[], rows: PlacementRow[]): PlacementCommentary {
  const criticalFlags = flags.filter((flag) => flag.severity === "critical").length;
  const openQuotedGap = round1(summary.totalTargetSharePct - summary.projectedSharePct);
  const topOpenMarket = rows
    .filter((row) => row.status !== "placed")
    .sort((left, right) => right.followUpAgeDays - left.followUpAgeDays)[0];

  return {
    executiveSummary: `${summary.accountName} is ${summary.placementProgressPct}% placed against the target line. ${summary.openSharePct}% of target share is still open and ${criticalFlags} critical follow-up flag(s) are active.`,
    observations: [
      `${summary.placedMarkets} market(s) have signed ${summary.placedSharePct}% of the target line so far.`,
      `Projected placement reaches ${summary.projectedSharePct}% of target share after quotes, leaving a ${openQuotedGap}% residual gap.`,
      `Weighted market appetite moved ${summary.weightedCapacityChangePct}% versus the original ask.`
    ],
    actions: [
      topOpenMarket
        ? `Chase ${topOpenMarket.marketName} first; it has been open for ${topOpenMarket.followUpAgeDays} day(s) with ${topOpenMarket.targetSharePct - Math.max(topOpenMarket.signedSharePct, topOpenMarket.quotedSharePct)} point(s) still uncovered.`
        : "No open markets remain. Confirm final signings and close the placement.",
      flags.some((flag) => flag.code === "lead_dependency")
        ? "Reduce reliance on the lead line by prioritising follower completion and replacement options."
        : "Lead dependency is acceptable at the current stage.",
      summary.projectedProgressPct < 100
        ? "Keep replacement options warm until projected capacity reaches 100% of the target line."
        : "Projected capacity already covers the target line; focus on converting quotes to signed lines."
    ]
  };
}

function buildQueryHits(rows: PlacementRow[], flags: PriorityFlag[], question?: string | null): string[] {
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

  const lines = [
    ...rows.map(
      (row) =>
        `${row.marketName} ${row.status} target ${row.targetSharePct}% signed ${row.signedSharePct}% quoted ${row.quotedSharePct}% follow-up ${row.followUpAgeDays} days ${row.classOfBusiness} ${row.territory}`
    ),
    ...flags.map((flag) => `${flag.title} ${flag.marketName ?? "portfolio"} ${flag.detail}`)
  ];

  return lines.filter((line) => tokens.some((token) => line.toLowerCase().includes(token))).slice(0, 6);
}

export function buildPlacementInsight(csvText: string, question?: string | null): PlacementInsight {
  const parsed = parsePlacementCsv(csvText);
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]);
  }

  const rows = parsed.rows;
  const totalTargetSharePct = rows.reduce((sum, row) => sum + row.targetSharePct, 0);
  const placedSharePct = round1(rows.reduce((sum, row) => sum + row.signedSharePct, 0));
  const projectedSharePct = round1(rows.reduce((sum, row) => sum + Math.max(row.signedSharePct, row.quotedSharePct), 0));
  const openSharePct = round1(Math.max(totalTargetSharePct - placedSharePct, 0));
  const lineSizeGbp = rows[0]?.lineSizeGbp ?? 0;
  const leadMarket = [...rows].sort((left, right) => right.signedSharePct - left.signedSharePct)[0] ?? rows[0];
  const weightedCapacityChangePct = round1(
    rows.reduce((sum, row) => sum + row.capacityChangePct * row.targetSharePct, 0) / totalTargetSharePct
  );

  const summary: PlacementInsight["summary"] = {
    accountName: rows[0]?.accountName ?? "Unknown account",
    leadMarketName: leadMarket?.marketName ?? "Unknown market",
    leadSignedSharePct: round1(leadMarket?.signedSharePct ?? 0),
    lineSizeGbp,
    openMarkets: rows.filter((row) => row.status !== "placed").length,
    openSharePct,
    placedMarkets: rows.filter((row) => row.status === "placed").length,
    placedSharePct,
    placementId: rows[0]?.placementId ?? "Unknown placement",
    placementProgressPct: round1((placedSharePct / totalTargetSharePct) * 100),
    projectedSharePct,
    projectedProgressPct: round1((projectedSharePct / totalTargetSharePct) * 100),
    totalMarkets: rows.length,
    totalTargetSharePct: round1(totalTargetSharePct),
    weightedCapacityChangePct
  };

  const priorityFlags = buildPriorityFlags(rows);
  const marketProgression: MarketProgress[] = rows
    .map((row) => ({
      accountName: row.accountName,
      broker: row.broker,
      capacityChangePct: row.capacityChangePct,
      followUpAgeDays: row.followUpAgeDays,
      marketName: row.marketName,
      priority: derivePriority(row, priorityFlags),
      projectedLineGbp: Math.round((Math.max(row.signedSharePct, row.quotedSharePct) / 100) * row.lineSizeGbp),
      quotedSharePct: round1(row.quotedSharePct),
      remainingSharePct: round1(Math.max(row.targetSharePct - row.signedSharePct, 0)),
      signedLineGbp: Math.round((row.signedSharePct / 100) * row.lineSizeGbp),
      signedSharePct: round1(row.signedSharePct),
      status: row.status,
      targetLineGbp: Math.round((row.targetSharePct / 100) * row.lineSizeGbp),
      targetSharePct: round1(row.targetSharePct)
    }))
    .sort((left, right) => {
      const priorityDelta = severityRank(right.priority) - severityRank(left.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return right.targetSharePct - left.targetSharePct;
    });

  return {
    commentary: buildCommentary(summary, priorityFlags, rows),
    marketProgression,
    priorityFlags,
    queryHits: buildQueryHits(rows, priorityFlags, question),
    statusLanes: buildStatusLanes(rows, totalTargetSharePct),
    summary
  };
}

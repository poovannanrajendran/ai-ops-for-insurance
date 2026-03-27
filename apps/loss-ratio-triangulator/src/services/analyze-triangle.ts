import { z } from "zod";

import type {
  AccidentYearResult,
  CumulativeTriangle,
  LDF,
  TriangleInsight,
  TriangleWhitespaceRow
} from "@/types/triangle";

const requestSchema = z.object({
  triangleText: z.string().min(20),
  sourceLabel: z.string().min(3).optional(),
  question: z.string().min(6).optional()
});

interface ParseOutput {
  triangle: CumulativeTriangle;
  tailFactor: number | null;
  nullCount: number;
  lowerRightContamination: boolean;
}

function normaliseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[£$,\s]/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTailFactor(raw: string): { text: string; tailFactor: number | null } {
  const lines = raw.split(/\r?\n/);
  let tailFactor: number | null = null;
  const filtered: string[] = [];
  for (const line of lines) {
    const match = line.match(/^tail_factor\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*$/i);
    if (match) {
      tailFactor = Number(match[1]);
      continue;
    }
    filtered.push(line);
  }
  return { text: filtered.join("\n"), tailFactor };
}

function looksLikeYear(value: string): boolean {
  return /^\d{4}$/.test(value) && Number(value) >= 1990 && Number(value) <= 2040;
}

function parseTriangle(rawInput: string): ParseOutput {
  const { text, tailFactor } = parseTailFactor(rawInput);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const delimiter = lines.some((line) => line.includes("\t")) ? /\t+/ : /\s*,\s*/;
  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  if (rows.length < 2) throw new Error("Triangle needs at least 2 rows.");

  let hasHeader = false;
  let hasYearColumn = false;

  if (rows[0].length >= 2) {
    const firstRowNumeric = rows[0].slice(1).every((cell) => /^\d+$/.test(cell));
    hasHeader = rows[0][0].toLowerCase() === "ay" || firstRowNumeric;
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  hasYearColumn = dataRows.every((row) => looksLikeYear(row[0] ?? ""));

  const width = Math.max(...dataRows.map((row) => row.length));
  const devCount = hasYearColumn ? width - 1 : width;
  if (devCount < 2) throw new Error("Triangle needs at least 2 development columns.");

  const devPeriods = hasHeader
    ? rows[0]
        .slice(hasYearColumn ? 1 : 0)
        .map((cell, index) => Number(cell) || (index + 1) * 12)
    : Array.from({ length: devCount }, (_, index) => (index + 1) * 12);

  const accidentYears = dataRows.map((row, idx) => (hasYearColumn ? Number(row[0]) : 2019 + idx));
  const rawCells = dataRows.map((row) => {
    const trimmed = hasYearColumn ? row.slice(1) : row;
    return Array.from({ length: devCount }, (_, idx) => normaliseNumber(trimmed[idx] ?? ""));
  });

  let inputType: CumulativeTriangle["inputType"] = "cumulative";
  for (const row of rawCells) {
    let last: number | null = null;
    for (const value of row) {
      if (value == null) continue;
      if (last != null && value < last) {
        inputType = "incremental";
        break;
      }
      last = value;
    }
    if (inputType === "incremental") break;
  }

  const cumulativeCells = rawCells.map((row) => {
    if (inputType === "cumulative") return row;
    let running = 0;
    return row.map((value) => {
      if (value == null) return null;
      running += value;
      return running;
    });
  });

  let nullCount = 0;
  let lowerRightContamination = false;
  cumulativeCells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell == null) {
        nullCount += 1;
        return;
      }
      if (colIndex > rowIndex + 1) lowerRightContamination = true;
    });
  });

  return {
    triangle: {
      accidentYears,
      devPeriods,
      cells: cumulativeCells,
      inputType
    },
    tailFactor,
    nullCount,
    lowerRightContamination
  };
}

function computeLdfs(triangle: CumulativeTriangle, tailFactor: number | null): LDF[] {
  const ldfs: LDF[] = [];
  for (let i = 0; i < triangle.devPeriods.length - 1; i += 1) {
    let numerator = 0;
    let denominator = 0;
    let dataPoints = 0;
    for (const row of triangle.cells) {
      const from = row[i];
      const to = row[i + 1];
      if (from == null || to == null) continue;
      numerator += to;
      denominator += from;
      dataPoints += 1;
    }
    const weightedAvgFactor = denominator > 0 ? numerator / denominator : 1;
    ldfs.push({
      fromPeriod: triangle.devPeriods[i],
      toPeriod: triangle.devPeriods[i + 1],
      weightedAvgFactor: Number(weightedAvgFactor.toFixed(4)),
      selectedFactor: Number(weightedAvgFactor.toFixed(4)),
      dataPoints
    });
  }
  if (tailFactor != null && ldfs.length > 0) {
    const last = ldfs[ldfs.length - 1];
    ldfs[ldfs.length - 1] = {
      ...last,
      selectedFactor: Number((last.selectedFactor * tailFactor).toFixed(4))
    };
  }
  return ldfs;
}

function ldfProduct(ldfs: LDF[], startIndex: number): number {
  return ldfs.slice(startIndex).reduce((acc, item) => acc * item.selectedFactor, 1);
}

function buildResults(triangle: CumulativeTriangle, ldfs: LDF[]): AccidentYearResult[] {
  return triangle.cells.map((row, rowIndex) => {
    let latestIndex = -1;
    let latestDiagonal = 0;
    row.forEach((cell, colIndex) => {
      if (cell != null) {
        latestIndex = colIndex;
        latestDiagonal = cell;
      }
    });

    const cumulativeLDF = latestIndex < 0 ? 1 : ldfProduct(ldfs, latestIndex);
    const ultimateEstimate = latestDiagonal * cumulativeLDF;
    const ibnr = ultimateEstimate - latestDiagonal;
    const pctDeveloped = ultimateEstimate > 0 ? (latestDiagonal / ultimateEstimate) * 100 : 100;

    return {
      accidentYear: triangle.accidentYears[rowIndex],
      latestDiagonal: Number(latestDiagonal.toFixed(2)),
      latestDevPeriod: latestIndex >= 0 ? triangle.devPeriods[latestIndex] : triangle.devPeriods[0],
      cumulativeLDF: Number(cumulativeLDF.toFixed(4)),
      ultimateEstimate: Number(ultimateEstimate.toFixed(2)),
      ibnr: Number(ibnr.toFixed(2)),
      pctDeveloped: Number(pctDeveloped.toFixed(1)),
      isProjected: pctDeveloped < 99.5
    };
  });
}

function computeBand(ibnrToPaidRatio: number, pctDevelopedAvg: number): "adequate" | "watch" | "strengthening-required" {
  if (ibnrToPaidRatio > 0.6 || pctDevelopedAvg < 55) return "strengthening-required";
  if (ibnrToPaidRatio > 0.25 || pctDevelopedAvg < 75) return "watch";
  return "adequate";
}

function computeConfidence(completenessPct: number, sparseLdfCount: number): "high" | "medium" | "low" {
  if (completenessPct >= 90 && sparseLdfCount === 0) return "high";
  if (completenessPct >= 70) return "medium";
  return "low";
}

function whitespaceRows(insight: TriangleInsight): TriangleWhitespaceRow[] {
  return [
    { fieldWording: "Input type", extractedValue: insight.triangle.inputType, status: "EXTRACTED" },
    { fieldWording: "Accident years", extractedValue: String(insight.triangle.accidentYears.length), status: "EXTRACTED" },
    { fieldWording: "Development periods", extractedValue: String(insight.triangle.devPeriods.length), status: "EXTRACTED" },
    {
      fieldWording: "Tail factor",
      extractedValue: insight.summary.tailFactor == null ? "Not provided" : String(insight.summary.tailFactor),
      status: insight.summary.tailFactor == null ? "MISSING" : "EXTRACTED",
      optional: true
    },
    { fieldWording: "Total paid", extractedValue: String(insight.summary.totalPaid), status: "EXTRACTED" },
    { fieldWording: "Total ultimate", extractedValue: String(insight.summary.totalUltimate), status: "EXTRACTED" },
    { fieldWording: "Total IBNR", extractedValue: String(insight.summary.totalIbnr), status: "EXTRACTED" },
    { fieldWording: "Reserving band", extractedValue: insight.summary.reservingBand, status: "EXTRACTED" },
    { fieldWording: "Confidence", extractedValue: insight.summary.confidence, status: "EXTRACTED" }
  ];
}

export function analyzeTriangle(input: unknown): TriangleInsight {
  const parsed = requestSchema.parse(input);
  const parse = parseTriangle(parsed.triangleText);
  const ldfs = computeLdfs(parse.triangle, parse.tailFactor);
  const results = buildResults(parse.triangle, ldfs);

  const totalUltimate = Number(results.reduce((acc, row) => acc + row.ultimateEstimate, 0).toFixed(2));
  const totalPaid = Number(results.reduce((acc, row) => acc + row.latestDiagonal, 0).toFixed(2));
  const totalIbnr = Number((totalUltimate - totalPaid).toFixed(2));
  const ibnrToPaidRatio = totalPaid > 0 ? Number((totalIbnr / totalPaid).toFixed(4)) : 0;

  const cellTotal = parse.triangle.cells.length * parse.triangle.devPeriods.length;
  const nonNull = cellTotal - parse.nullCount;
  const completenessPct = Number(((nonNull / cellTotal) * 100).toFixed(1));

  const sparseLdfCount = ldfs.filter((ldf) => ldf.dataPoints < 2).length;
  const pctDevelopedAvg = results.length > 0 ? results.reduce((acc, item) => acc + item.pctDeveloped, 0) / results.length : 100;

  const warnings: string[] = [];
  if (parse.triangle.devPeriods.at(-1)! < 60) warnings.push("Development tail shorter than 60 months increases uncertainty.");
  if (sparseLdfCount > 0) warnings.push(`Sparse LDF transitions detected in ${sparseLdfCount} period(s).`);
  if (results.some((row) => row.pctDeveloped < 55)) warnings.push("At least one accident year is materially immature (<55% developed).");
  if (parse.nullCount > 0) warnings.push(`${parse.nullCount} null cell(s) found in the triangle input.`);
  if (parse.lowerRightContamination) warnings.push("Lower-right contamination detected; verify triangle ordering and data hygiene.");

  const reservingBand = computeBand(ibnrToPaidRatio, pctDevelopedAvg);
  const confidence = computeConfidence(completenessPct, sparseLdfCount);

  const methodology = [
    "Triangle parsed and normalized to cumulative development form.",
    "Volume-weighted age-to-age factors selected for each development transition.",
    "Ultimate estimates projected from latest diagonal using remaining cumulative LDF.",
    `IBNR computed as Ultimate - Paid with portfolio band set to ${reservingBand}.`
  ];

  const auditNotes = [
    `${parse.triangle.accidentYears.length} accident year(s), ${parse.triangle.devPeriods.length} development period(s).`,
    `${ldfs.length} LDF transition(s); sparse transitions=${sparseLdfCount}.`,
    parse.tailFactor == null ? "No explicit tail factor provided." : `Tail factor ${parse.tailFactor} applied to final transition.`,
    `Completeness=${completenessPct}% | Confidence=${confidence}.`
  ];

  const queryTokens = (parsed.question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const promptPool = [...warnings, ...methodology, ...auditNotes];
  const promptHits = promptPool.filter((line) => queryTokens.some((token) => line.toLowerCase().includes(token)));

  const insight: TriangleInsight = {
    summary: {
      completenessPct,
      totalUltimate,
      totalPaid,
      totalIbnr,
      ibnrToPaidRatio,
      tailFactor: parse.tailFactor,
      confidence,
      warnings,
      reservingBand
    },
    triangle: parse.triangle,
    ldfs,
    results,
    methodology,
    auditNotes,
    promptHits,
    whitespaceRows: []
  };

  insight.whitespaceRows = whitespaceRows(insight);
  return insight;
}

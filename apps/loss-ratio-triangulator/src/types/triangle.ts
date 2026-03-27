export interface TriangleInput {
  triangleText: string;
  sourceLabel?: string;
  question?: string;
}

export type TriangleCell = number | null;

export interface CumulativeTriangle {
  accidentYears: number[];
  devPeriods: number[];
  cells: TriangleCell[][];
  inputType: "cumulative" | "incremental";
}

export interface LDF {
  fromPeriod: number;
  toPeriod: number;
  weightedAvgFactor: number;
  selectedFactor: number;
  dataPoints: number;
}

export interface AccidentYearResult {
  accidentYear: number;
  latestDiagonal: number;
  latestDevPeriod: number;
  cumulativeLDF: number;
  ultimateEstimate: number;
  ibnr: number;
  pctDeveloped: number;
  isProjected: boolean;
}

export interface TriangleSummary {
  completenessPct: number;
  totalUltimate: number;
  totalPaid: number;
  totalIbnr: number;
  ibnrToPaidRatio: number;
  tailFactor: number | null;
  confidence: "high" | "medium" | "low";
  warnings: string[];
  reservingBand: "adequate" | "watch" | "strengthening-required";
}

export type ExtractionStatus = "EXTRACTED" | "MISSING" | "INFERRED";

export interface TriangleWhitespaceRow {
  fieldWording: string;
  extractedValue: string;
  status: ExtractionStatus;
  optional?: boolean;
}

export interface TriangleInsight {
  summary: TriangleSummary;
  triangle: CumulativeTriangle;
  ldfs: LDF[];
  results: AccidentYearResult[];
  methodology: string[];
  auditNotes: string[];
  promptHits: string[];
  whitespaceRows: TriangleWhitespaceRow[];
}

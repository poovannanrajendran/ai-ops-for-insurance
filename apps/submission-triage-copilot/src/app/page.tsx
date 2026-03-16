"use client";

import {
  AppGroupLogo,
  Card,
  SubmissionTriageLogo
} from "@ai-ops/common-ui";
import { submissionTextFromFile } from "@/lib/submission-file";
import { sampleSubmissionSets, sampleSubmissionText } from "@/lib/submission-samples";
import type { SubmissionAnalysis } from "@/types/submission";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: SubmissionAnalysis;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs: number;
  requestId: string;
}

interface AnalyzeError {
  error: string;
  missingFields?: string[];
}

function formatDuration(ms: number | null): string {
  if (ms == null) {
    return "00:00:00";
  }

  const totalMilliseconds = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((totalMilliseconds % 1000) / 10)).padStart(2, "0");

  return `${minutes}:${seconds}:${centiseconds}`;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Submission Triage Copilot";

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submissionText, setSubmissionText] = useState<string>(sampleSubmissionText);
  const [sourceLabel, setSourceLabel] = useState<string>(
    sampleSubmissionSets[0]?.label ?? "submission-sample.txt"
  );
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);

  async function runAnalysis() {
    const response = await fetch("/api/submissiontriage/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ submissionText })
    });

    const data = (await response.json()) as AnalyzeResponse | AnalyzeError;

    if (!response.ok || "error" in data) {
      setResult(null);
      if ("error" in data) {
        setError(data.error);
        setMissingFields(data.missingFields ?? []);
        setIsMissingFieldsOpen(true);
      } else {
        setError("Analysis failed.");
        setMissingFields([]);
      }
      return;
    }

    setAnalysisTimeMs(data.processingTimeMs);
    setResult(data);
    setMissingFields([]);
  }

  function submit() {
    setError(null);
    setMissingFields([]);
    setIsMissingFieldsOpen(false);
    setIsPending(true);

    void runAnalysis()
      .catch((requestError) => {
        setResult(null);
        setError(
          requestError instanceof Error ? requestError.message : "Unknown request failure."
        );
        setMissingFields([]);
        setIsMissingFieldsOpen(false);
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await submissionTextFromFile(file);
      setSourceLabel(file.name);
      setSubmissionText(text);
      setError(null);
      setMissingFields([]);
      setIsMissingFieldsOpen(false);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Unable to read the selected file.");
      setMissingFields([]);
      setIsMissingFieldsOpen(false);
    }
  }

  const whitespaceMatches = buildWhitespaceMatches(result);

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <SubmissionTriageLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    Day 1 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  {appName}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Internal underwriting intake assistant for fast first-pass review of broker
                  submissions, structured extraction, and appetite recommendation.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard
                label="Storage"
                value={
                  result
                    ? result.persistence.status === "stored"
                      ? "Supabase synced"
                      : result.persistence.status === "failed"
                        ? "Needs attention"
                        : "Pending credentials"
                    : "Awaiting run"
                }
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <Card
            eyebrow="Submission intake"
            title="Broker submission workspace"
            actions={
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    const nextIndex = (sampleIndex + 1) % sampleSubmissionSets.length;
                    const nextSample = sampleSubmissionSets[nextIndex];
                    setSampleIndex(nextIndex);
                    setSubmissionText(
                      nextSample.fields.map(([field, value]) => `${field}: ${value}`).join("\n")
                    );
                    setSourceLabel(nextSample.label);
                    setError(null);
                    setMissingFields([]);
                    setIsMissingFieldsOpen(false);
                  }}
                  type="button"
                >
                  Load next sample
                </button>
                <button
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Upload Excel or text
                </button>
                <a
                  className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-white"
                  download
                  href="/samples/submission-triage-sample.xlsx"
                >
                  Download sample Excel
                </a>
                <input
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={handleFileSelection}
                  ref={fileInputRef}
                  type="file"
                />
              </div>
            }
          >
            <div className="space-y-5">
              <div className="rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Internal operating note
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Upload a broker slip in Excel or paste submission notes directly. Excel uploads
                  are converted into structured text before the same Day 1 rules engine runs. The
                  downloadable workbook includes a submission brief, exposure schedule, and loss
                  runs sheet so the sample feels closer to a real underwriting handoff.
                </p>
              </div>

              <textarea
                className="min-h-88 w-full rounded-[28px] border border-[var(--panel-border)] bg-white px-6 py-5 text-base leading-8 text-slate-800 outline-none ring-0 transition focus:border-[var(--accent)]"
                onChange={(event) => setSubmissionText(event.target.value)}
                value={submissionText}
              />

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Running review..." : "Analyze submission"}
                  </button>
                  <p className="text-sm text-slate-500">
                    Supports `.xlsx`, `.xls`, `.csv`, and `.txt` source files.
                  </p>
                </div>
                {result ? (
                  <p className="text-sm font-medium text-slate-500">Request ID: {result.requestId}</p>
                ) : null}
              </div>
              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
              {missingFields.length > 0 ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left font-semibold"
                    type="button"
                    onClick={() => setIsMissingFieldsOpen((prev) => !prev)}
                  >
                    Missing required fields
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {isMissingFieldsOpen ? "Hide" : "Show"}
                    </span>
                  </button>
                  {isMissingFieldsOpen ? (
                    <p className="mt-2 text-amber-800">
                      Please add: {missingFields.join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>

          <div className="space-y-6">
            <Card eyebrow="Decision" title="Appetite recommendation">
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {result.analysis.decision}
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      Confidence {Math.round(result.analysis.confidence * 100)}%
                    </p>
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-slate-700">
                    {result.analysis.rationale.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState text="Run the analysis to generate the internal recommendation and rationale." />
              )}
            </Card>

            <Card eyebrow="Structured extraction" title="Captured submission fields">
              {result ? (
                <dl className="grid gap-3 text-sm text-slate-700">
                  <FieldRow label="Broker" value={result.analysis.extracted.broker ?? "Not extracted"} />
                  <FieldRow label="Class" value={result.analysis.extracted.classOfBusiness} />
                  <FieldRow label="Territory" value={result.analysis.extracted.territory} />
                  <FieldRow
                    label="Limit"
                    value={
                      result.analysis.extracted.limitAmount
                        ? `${result.analysis.extracted.currency ?? ""} ${result.analysis.extracted.limitAmount.toLocaleString()}`.trim()
                        : "Not extracted"
                    }
                  />
                  <FieldRow
                    label="Flags"
                    value={
                      result.analysis.extracted.warningFlags.length > 0
                        ? result.analysis.extracted.warningFlags.join(", ")
                        : "None"
                    }
                  />
                </dl>
              ) : (
                <EmptyState text="Structured output will appear here after the submission is analyzed." />
              )}
            </Card>

            <Card eyebrow="Storage" title="Persistence status">
              <p className="text-sm leading-6 text-slate-600">
                {result
                  ? result.persistence.status === "stored"
                    ? "Result stored in Supabase."
                    : result.persistence.status === "failed"
                      ? `Supabase storage failed. ${result.persistence.reason ?? ""}`.trim()
                      : `Storage ${result.persistence.status}. ${result.persistence.reason ?? ""}`.trim()
                  : "The route will attempt Supabase storage when server access is available in the local environment."}
              </p>
            </Card>
          </div>
        </div>

        <Card eyebrow="Whitespace tagging" title="Defined data alignment">
          <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] p-4 text-xs text-slate-600">
            This table maps extracted values to Whitespace-defined data tags using the
            standard field names for contract headings.
          </div>
          <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--panel-border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Whitespace tag</th>
                  <th className="px-4 py-3">Extracted value</th>
                </tr>
              </thead>
              <tbody>
                {whitespaceMatches.map((row) => (
                  <tr key={row.tag} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.tag}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>{row.value}</span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            row.status === "Matched"
                              ? "bg-emerald-50 text-emerald-700"
                              : row.status === "Partial"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] px-4 py-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="max-w-[15rem] text-right text-slate-900">{value}</dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-slate-600">{text}</p>;
}

type WhitespaceMatch = {
  tag: string;
  value: string;
  status: "Matched" | "Partial" | "Missing";
};

function toMatchStatus(value: string): WhitespaceMatch["status"] {
  return value === "Not extracted" ? "Missing" : "Matched";
}

function extractCity(headquarters: string | null | undefined): string | null {
  if (!headquarters) {
    return null;
  }

  const [city] = headquarters.split(",");
  return city?.trim() || headquarters;
}

function buildWhitespaceMatches(result: AnalyzeResponse | null): WhitespaceMatch[] {
  if (!result) {
    return [
      { tag: "Insured Name", value: "Run analysis to populate", status: "Missing" },
      { tag: "Insured Number And Street", value: "Run analysis to populate", status: "Missing" },
      { tag: "Insured City Name", value: "Run analysis to populate", status: "Missing" },
      { tag: "Insured Country", value: "Run analysis to populate", status: "Missing" },
      { tag: "Insured Country Subentity", value: "Run analysis to populate", status: "Missing" },
      { tag: "Insured Postal Code", value: "Run analysis to populate", status: "Missing" },
      { tag: "Class Of Business", value: "Run analysis to populate", status: "Missing" },
      { tag: "Risk Location Country", value: "Run analysis to populate", status: "Missing" },
      { tag: "Risk Location Country Subentity", value: "Run analysis to populate", status: "Missing" },
      { tag: "Broker Reference", value: "Run analysis to populate", status: "Missing" },
      { tag: "Coverage Basis", value: "Run analysis to populate", status: "Missing" },
      { tag: "Coverage Amount", value: "Run analysis to populate", status: "Missing" }
    ];
  }

  const extracted = result.analysis.extracted;
  const territory = extracted.territory;
  const limitAmount = extracted.limitAmount
    ? `${extracted.currency ?? ""} ${extracted.limitAmount.toLocaleString()}`.trim()
    : "Not extracted";
  const insuredName = extracted.insuredName ?? "Not extracted";
  const insuredCity = extractCity(extracted.headquarters);
  const insuredCountry = extracted.territory || "Not extracted";
  const coverageBasis = extracted.attachment ?? "Not extracted";

  return [
    {
      tag: "Insured Name",
      value: insuredName,
      status: toMatchStatus(insuredName)
    },
    {
      tag: "Insured Number And Street",
      value: "Not extracted",
      status: "Missing"
    },
    {
      tag: "Insured City Name",
      value: insuredCity ?? "Not extracted",
      status: toMatchStatus(insuredCity ?? "Not extracted")
    },
    {
      tag: "Insured Country",
      value: insuredCountry,
      status: toMatchStatus(insuredCountry)
    },
    {
      tag: "Insured Country Subentity",
      value: "Not extracted",
      status: "Missing"
    },
    {
      tag: "Insured Postal Code",
      value: "Not extracted",
      status: "Missing"
    },
    {
      tag: "Class Of Business",
      value: extracted.classOfBusiness,
      status: extracted.classOfBusiness ? "Matched" : "Missing"
    },
    {
      tag: "Risk Location Country",
      value: territory || "Not extracted",
      status: toMatchStatus(territory || "Not extracted")
    },
    {
      tag: "Risk Location Country Subentity",
      value: "Not extracted",
      status: "Missing"
    },
    {
      tag: "Broker Reference",
      value: "Not extracted",
      status: "Missing"
    },
    {
      tag: "Coverage Basis",
      value: coverageBasis,
      status: toMatchStatus(coverageBasis)
    },
    {
      tag: "Coverage Amount",
      value: limitAmount,
      status: toMatchStatus(limitAmount)
    }
  ];
}

"use client";

import { AppGroupLogo, Card, SlipReviewerLogo } from "@ai-ops/common-ui";
import { demoSamples } from "@/lib/demo-samples";
import type { SlipReviewInsight } from "@/types/slip-review";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: SlipReviewInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Slip Reviewer";

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

async function extractPdfText(file: File): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs")]);

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
  }

  const pdfData = await file.arrayBuffer();
  const pdf = await getDocument({ data: pdfData }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [slipText, setSlipText] = useState<string>(demoSamples[0].statementText);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState<string>(
    "What are the unusual clauses, coverage gaps, and required gate findings?"
  );
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/slipreviewer/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slipText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Slip review analysis failed.");
      return;
    }

    setAnalysisTimeMs(
      typeof data.processingTimeMs === "number"
        ? data.processingTimeMs
        : Math.round(performance.now() - startedAt)
    );
    setResult(data);
  }

  function submit() {
    setError(null);
    setIsPending(true);

    void runAnalysis()
      .catch((requestError) => {
        setResult(null);
        setError(requestError instanceof Error ? requestError.message : "Unknown request failure.");
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);

    if (!sample) {
      return;
    }

    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setSlipText(sample.statementText);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      void extractPdfText(file)
        .then((text) => {
          if (!text.trim()) {
            setError("No extractable text found in the selected PDF.");
            return;
          }
          setSlipText(text);
        })
        .catch(() => {
          setError("Unable to extract text from the selected PDF.");
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setSlipText(text);
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <SlipReviewerLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    Day 4 Internal Tool
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
                  Upload or paste a London Market slip to extract key fields, run a required-field gate,
                  and surface unusual clauses plus coverage gap commentary for reviewer sign-off.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
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
              <MetaCard label="Mode" value="Slip extraction and anomaly review" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Slip source and content">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Slip source</label>
                  <div className="flex min-h-[280px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Upload zone
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use built-in public-domain samples, paste slip text, or load a local `.txt` or `.pdf`.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                        >
                          Select File
                        </button>
                        <button
                          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                          onClick={() => loadSample(demoSamples[0].id)}
                          type="button"
                        >
                          Reset sample
                        </button>
                        <input
                          accept=".txt,text/plain,.pdf,application/pdf"
                          className="hidden"
                          onChange={handleFileSelection}
                          ref={fileInputRef}
                          type="file"
                        />
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-4">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="sourceLabel">
                        Source label
                      </label>
                      <input
                        className="w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                        id="sourceLabel"
                        onChange={(event) => setSourceLabel(event.target.value)}
                        value={sourceLabel}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoSamples.map((sample) => (
                    <button
                      className={`rounded-[20px] border p-3 text-left transition ${
                        selectedSampleId === sample.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--panel-border)] bg-white/72"
                      }`}
                      key={sample.id}
                      onClick={() => loadSample(sample.id)}
                      type="button"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {sample.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{sample.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="slipText">
                    Slip text
                  </label>
                  <textarea
                    className="min-h-[280px] w-full rounded-[16px] border border-slate-300 bg-white px-5 py-4 text-sm leading-7 text-slate-800 outline-none ring-0"
                    id="slipText"
                    onChange={(event) => setSlipText(event.target.value)}
                    value={slipText}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="questionInput">
                    Query prompt
                  </label>
                  <input
                    className="w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                    id="questionInput"
                    onChange={(event) => setQuestion(event.target.value)}
                    value={question}
                  />
                </div>

                <div className="flex flex-col items-center gap-2 pt-1">
                  <button
                    className="rounded-full bg-[var(--accent)] px-12 py-3 text-base font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Analyzing..." : "Analyze slip"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Runs deterministic extraction and Day 4 rule checks through the app route.
                  </p>
                </div>
                {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Required Gate" title="Minimum field check">
            {result ? (
              <div className="space-y-3">
                <p className={`text-base font-semibold ${result.analysis.summary.gatePassed ? "text-emerald-700" : "text-red-700"}`}>
                  {result.analysis.summary.gatePassed
                    ? "Gate passed: all required fields detected."
                    : "Gate failed: required fields are missing."}
                </p>
                {!result.analysis.summary.gatePassed ? (
                  <ul className="space-y-2 text-sm leading-6 text-slate-700">
                    {result.analysis.summary.missingRequiredFields.map((field) => (
                      <li key={field}>- {field}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Required gate checks for `insured_name`, `inception_date`, `expiry_date`, `limit`, and
                `currency` appear here after analysis.
              </p>
            )}
          </Card>

          <Card eyebrow="Commentary" title="Executive readout">
            {result ? (
              <div className="space-y-4">
                <p className="text-base font-semibold text-slate-900">
                  {result.analysis.commentary.executiveSummary}
                </p>
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.commentary.observations.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Run analysis to generate structured summary commentary.
              </p>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Unusual Clauses" title="Clause-level review flags">
            {result ? (
              result.analysis.unusualClauses.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.unusualClauses.map((flag) => (
                    <div
                      className={`rounded-[20px] border px-4 py-3 ${
                        flag.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                      }`}
                      key={`${flag.clause}-${flag.rationale}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{flag.clause}</p>
                      <p className="mt-1 text-sm text-slate-700">{flag.rationale}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">No unusual clause flags were generated.</p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Clause anomalies and market-review flags appear here after analysis.
              </p>
            )}
          </Card>

          <Card eyebrow="Coverage Gaps" title="Review gaps and rationale">
            {result ? (
              result.analysis.coverageGaps.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.coverageGaps.map((gap) => (
                    <div
                      className={`rounded-[20px] border px-4 py-3 ${
                        gap.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                      }`}
                      key={`${gap.gap}-${gap.rationale}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{gap.gap}</p>
                      <p className="mt-1 text-sm text-slate-700">{gap.rationale}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">No coverage gap flags were generated.</p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Coverage gap detection appears here, including missing fields and operational blind spots.
              </p>
            )}
          </Card>
        </div>

        <Card eyebrow="Field Mapping" title="Day 4 data contract alignment">
          {result ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="rounded-tl-[14px] border border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-600">
                      Field
                    </th>
                    <th className="border border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-600">
                      Extracted value
                    </th>
                    <th className="rounded-tr-[14px] border border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-600">
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.fieldMatches.map((item) => (
                    <tr key={item.fieldName}>
                      <td className="border border-slate-200 px-4 py-3 font-semibold text-slate-900">
                        {item.fieldName}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-slate-700">
                        {item.extractedValue ?? "Not extracted"}
                      </td>
                      <td className="border border-slate-200 px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "matched"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.status === "matched" ? "Matched" : "Missing"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              This table maps extraction output to the Day 4 slip reviewer contract fields.
            </p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card eyebrow="Query hits" title="Relevant extracted snippets">
            {result ? (
              result.analysis.query.hits.length > 0 ? (
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.query.hits.map((hit) => (
                    <li key={`${hit.fieldName}-${hit.snippet}`}>
                      <span className="font-semibold text-slate-900">{hit.fieldName}: </span>
                      {hit.snippet}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-slate-600">No direct extracted matches for the query prompt.</p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Run analysis to receive query-aligned field snippets.
              </p>
            )}
          </Card>

          <Card eyebrow="Persistence" title="Storage status">
            <p className="text-sm leading-6 text-slate-600">
              {result
                ? result.persistence.status === "stored"
                  ? "Result stored in Supabase."
                  : `Storage ${result.persistence.status}. ${result.persistence.reason ?? ""}`.trim()
                : "Supabase storage is optional. If server credentials exist, the analysis run is stored in the Day 4 schema."}
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/78 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

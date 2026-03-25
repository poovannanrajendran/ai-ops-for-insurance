"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { demoSamples } from "@/lib/demo-samples";
import type { ClashFinding, ExposureClashInsight } from "@/types/exposure-clash";

interface AnalyzeResponse {
  analysis: ExposureClashInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "00:00:00";
  const totalMilliseconds = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((totalMilliseconds % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${seconds}:${centiseconds}`;
}

function formatCurrency(value: number): string {
  return `GBP ${value.toLocaleString("en-GB")}`;
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [schedulesText, setSchedulesText] = useState(demoSamples[0].schedulesText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/exposureclash/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedulesText, sourceLabel, question })
    });
    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Exposure clash analysis failed.");
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
      .finally(() => setIsPending(false));
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;

    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setSchedulesText(sample.schedulesText);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);

    const reader = new FileReader();
    reader.onload = () => setSchedulesText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-white/40 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-cyan-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                    Day 13 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    30 Useful Insurance and Productivity Apps | Exposure Clash Detector
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  Exposure Clash Detector
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Detect overlapping exposures across schedules and highlight clash severity before
                  accumulation surprises emerge.
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
              <MetaCard label="Mode" value="Cross-schedule overlap and clash prioritisation" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Schedule source and content">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Schedule source</label>
                <div className="flex min-h-[310px] flex-col rounded-[26px] border border-dashed border-cyan-700/45 bg-white/70 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Upload zone
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Use built-in multi-schedule samples, paste CSV rows, or load a local `.csv`
                      / `.txt` extract.
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
                        accept=".csv,.txt,text/plain"
                        className="hidden"
                        onChange={handleFileSelection}
                        ref={fileInputRef}
                        type="file"
                      />
                    </div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="source-label">
                      Source label
                    </label>
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-cyan-700"
                      id="source-label"
                      onChange={(event) => setSourceLabel(event.target.value)}
                      value={sourceLabel}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {demoSamples.map((sample) => {
                  const isActive = sample.id === selectedSampleId;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => loadSample(sample.id)}
                      type="button"
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-cyan-700 bg-cyan-50 shadow-[0_12px_24px_rgba(8,145,178,0.2)]"
                          : "border-slate-200 bg-white/60 hover:border-cyan-700/45"
                      }`}
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {sample.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="schedules-text">
                  Schedule ledger (CSV)
                </label>
                <textarea
                  className="min-h-[310px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 font-mono text-sm leading-7 text-slate-700 outline-none transition focus:border-cyan-700"
                  id="schedules-text"
                  onChange={(event) => setSchedulesText(event.target.value)}
                  value={schedulesText}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="question">
                  Query prompt
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-cyan-700"
                  id="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  value={question}
                />
              </div>
              <div className="space-y-3">
                <button
                  className="rounded-full bg-cyan-700 px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(8,145,178,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={isPending}
                  onClick={submit}
                  type="button"
                >
                  {isPending ? "Analyzing..." : "Detect clashes"}
                </button>
                <p className="text-sm text-slate-500">
                  Runs deterministic overlap matching and clash severity checks through the app route.
                </p>
              </div>
              {error ? <StatusLine tone="issue" text={error} /> : null}
              {result?.persistence.reason ? <StatusLine tone="warn" text={result.persistence.reason} /> : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Clash overview">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                <li>Rows analysed: {result.analysis.summary.totalRows}</li>
                <li>Schedules detected: {result.analysis.summary.schedulesDetected}</li>
                <li>Clashes detected: {result.analysis.summary.clashesDetected}</li>
                <li>High-severity clashes: {result.analysis.summary.highSeverityClashes}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view clash summary.</p>
            )}
          </Card>
          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((hit) => (
                    <li key={hit}>{hit}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No snippets matched the query tokens in this run.
                </p>
              )
            ) : (
              <p className="text-sm text-slate-500">Query snippets appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Clashes" title="Detected overlap findings">
          {result ? (
            result.analysis.clashes.length > 0 ? (
              <ClashTable clashes={result.analysis.clashes} />
            ) : (
              <p className="text-sm text-emerald-700">No cross-schedule clashes detected in this run.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">Clash findings appear after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Concentration" title="Country concentration">
            {result ? (
              result.analysis.countryConcentration.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.countryConcentration.map((item) => (
                    <li key={item.label}>
                      {item.label}: {item.clashCount} clash(es), combined TIV{" "}
                      {formatCurrency(item.totalCombinedTivGbp)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No country concentration detected.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Concentration appears after analysis.</p>
            )}
          </Card>
          <Card eyebrow="Warnings" title="Governance flags">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.warnings.map((warning) => (
                    <li key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="flex items-start gap-2">
                        <StatusDot tone="warn" />
                        <span>{warning}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <StatusLine tone="ok" text="No clash warning is active." />
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings appear after analysis.</p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </article>
  );
}

function StatusLine({ tone, text }: { tone: "ok" | "warn" | "issue"; text: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm ${tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-red-600"}`}>
      <StatusDot tone={tone} />
      <span>{text}</span>
    </p>
  );
}

function StatusDot({ tone }: { tone: "ok" | "warn" | "issue" }) {
  const palette = tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-red-500";
  return <span aria-hidden className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${palette}`} />;
}

function ClashTable({ clashes }: { clashes: ClashFinding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <th className="px-3 py-2">Insured/location</th>
            <th className="px-3 py-2">Schedule pair</th>
            <th className="px-3 py-2">Peril</th>
            <th className="px-3 py-2">Overlap days</th>
            <th className="px-3 py-2">Combined TIV</th>
            <th className="px-3 py-2">Severity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {clashes.map((clash) => (
            <tr key={clash.clashId}>
              <td className="px-3 py-2">
                <p className="font-medium">{clash.insuredName}</p>
                <p className="text-xs text-slate-500">{clash.location}</p>
              </td>
              <td className="px-3 py-2">{clash.schedulePair}</td>
              <td className="px-3 py-2">{clash.peril}</td>
              <td className="px-3 py-2">{clash.overlapDays}</td>
              <td className="px-3 py-2">{formatCurrency(clash.combinedTivGbp)}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    clash.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {clash.severity.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

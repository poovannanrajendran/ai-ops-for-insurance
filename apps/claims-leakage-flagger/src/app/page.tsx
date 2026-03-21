"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { demoSamples } from "@/lib/demo-samples";
import type { ClaimsLeakageInsight, LeakageFinding, RuleCount } from "@/types/claims-leakage";

interface AnalyzeResponse {
  analysis: ClaimsLeakageInsight;
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
  const [claimsText, setClaimsText] = useState(demoSamples[0].claimsText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/claimsleakage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimsText, sourceLabel, question })
    });
    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Claims leakage analysis failed.");
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
    setClaimsText(sample.claimsText);
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
    reader.onload = () => setClaimsText(typeof reader.result === "string" ? reader.result : "");
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
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-rose-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-700">
                    Day 14 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    30 Useful Insurance and Productivity Apps | Claims Leakage Flagger
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  Claims Leakage Flagger
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Score bordereaux-style claims inputs for leakage indicators so handlers can focus on
                  recoverable reserve drift, duplicate patterns, and late notifications.
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
              <MetaCard label="Mode" value="Deterministic leakage scoring and governance triage" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Claims source and content">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Claims source</label>
                <div className="flex min-h-[310px] flex-col rounded-[26px] border border-dashed border-rose-700/45 bg-white/70 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
                      Upload zone
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Use built-in claims samples, paste bordereaux rows, or load a local `.csv` / `.txt`
                      extract from claims operations packs.
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
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-rose-700"
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
                          ? "border-rose-700 bg-rose-50 shadow-[0_12px_24px_rgba(190,24,93,0.15)]"
                          : "border-slate-200 bg-white/60 hover:border-rose-700/45"
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
                <label className="block text-sm font-semibold text-slate-700" htmlFor="claims-text">
                  Claims ledger (CSV)
                </label>
                <textarea
                  className="min-h-[310px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 font-mono text-sm leading-7 text-slate-700 outline-none transition focus:border-rose-700"
                  id="claims-text"
                  onChange={(event) => setClaimsText(event.target.value)}
                  value={claimsText}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="question">
                  Query prompt
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-rose-700"
                  id="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  value={question}
                />
              </div>
              <div className="space-y-3">
                <button
                  className="rounded-full bg-rose-700 px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(190,24,93,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={isPending}
                  onClick={submit}
                  type="button"
                >
                  {isPending ? "Analyzing..." : "Flag leakage"}
                </button>
                <p className="text-sm text-slate-500">
                  Runs deterministic leakage checks and governance scoring through the app route.
                </p>
              </div>
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              {result?.persistence.reason ? (
                <p className="text-sm text-amber-700">{result.persistence.reason}</p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Leakage overview">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                <li>Claims analysed: {result.analysis.summary.totalClaims}</li>
                <li>Flagged claims: {result.analysis.summary.flaggedClaims}</li>
                <li>High-severity claims: {result.analysis.summary.highSeverityClaims}</li>
                <li>Estimated leakage pressure: {formatCurrency(result.analysis.summary.estimatedLeakageGbp)}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run analysis to see leakage summary metrics.</p>
            )}
          </Card>
          <Card eyebrow="Warnings" title="Governance flags">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.warnings.length > 0 ? (
                  result.analysis.warnings.map((warning) => (
                    <li key={warning}>
                      <span className="mr-2">⚠️</span>
                      {warning}
                    </li>
                  ))
                ) : (
                  <li>No warnings triggered in this run.</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Warnings are generated after leakage scoring.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <Card eyebrow="Findings" title="Prioritised claim flags">
            {result ? (
              result.analysis.findings.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Claim</th>
                        <th className="px-3 py-2 font-semibold">Severity</th>
                        <th className="px-3 py-2 font-semibold">Score</th>
                        <th className="px-3 py-2 font-semibold">Top flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.analysis.findings.map((finding) => (
                        <LeakageRow key={finding.claimId} finding={finding} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No leakage findings were detected.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Run analysis to populate prioritised claim findings.</p>
            )}
          </Card>

          <div className="grid gap-5">
            <Card eyebrow="Rules" title="Triggered indicator counts">
              {result ? (
                result.analysis.ruleCounts.length > 0 ? (
                  <div className="space-y-2">
                    {result.analysis.ruleCounts.map((rule) => (
                      <RulePill key={rule.code} rule={rule} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No indicator rules were triggered.</p>
                )
              ) : (
                <p className="text-sm text-slate-500">Rule counts appear after analysis.</p>
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
                  <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
                )
              ) : (
                <p className="text-sm text-slate-500">Prompt matches appear once analysis is complete.</p>
              )}
            </Card>
          </div>
        </div>

        <Card eyebrow="Commentary" title="Executive readout">
          <p className="text-base leading-7 text-slate-700">
            {result
              ? result.analysis.commentary
              : "Upload claims ledger rows and run leakage scoring to receive executive commentary."}
          </p>
        </Card>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RulePill({ rule }: { rule: RuleCount }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {rule.code.replaceAll("_", " ")}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{rule.count}</p>
    </div>
  );
}

function LeakageRow({ finding }: { finding: LeakageFinding }) {
  return (
    <tr className="border-t border-slate-200 align-top">
      <td className="px-3 py-2">
        <p className="font-semibold text-slate-900">{finding.claimId}</p>
        <p className="text-xs text-slate-500">{finding.claimantName}</p>
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
            finding.severity === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {finding.severity}
        </span>
      </td>
      <td className="px-3 py-2 font-semibold text-slate-900">{finding.leakageScore}</td>
      <td className="px-3 py-2 text-slate-700">
        {finding.flags
          .slice(0, 2)
          .map((flag) => flag.code.replaceAll("_", " "))
          .join(" | ")}
      </td>
    </tr>
  );
}

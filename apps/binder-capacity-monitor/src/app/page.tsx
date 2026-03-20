"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { BinderCapacityLogo } from "@/components/binder-capacity-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { BinderInsight, BinderWarning, BreakdownMetric, TopRiskMetric } from "@/types/binder-capacity";

interface AnalyzeResponse {
  analysis: BinderInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Binder Capacity Monitor";

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

function formatCurrency(value: number): string {
  return `GBP ${value.toLocaleString("en-GB")}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [csvText, setCsvText] = useState<string>(demoSamples[0].csvText);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/bindercapacity/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Binder capacity analysis failed.");
      return;
    }

    setAnalysisTimeMs(typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(performance.now() - startedAt));
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
    setCsvText(sample.csvText);
    setQuestion(sample.question);
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

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(typeof reader.result === "string" ? reader.result : "");
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
                  <BinderCapacityLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 11 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Monitor delegated binder headroom, identify concentration drift, and surface current versus forecast breach risk
                  using deterministic capacity analytics.
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
              <MetaCard label="Mode" value="Binder utilization and forecast monitoring" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Binder source and portfolio ledger">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Ledger source</label>
                  <div className="flex min-h-[310px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use built-in binder ledgers, paste CSV rows, or load a local `.csv` / `.txt` extract.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => fileInputRef.current?.click()} type="button">
                          Select File
                        </button>
                        <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => loadSample(demoSamples[0].id)} type="button">
                          Reset sample
                        </button>
                        <input accept=".csv,.txt,text/plain" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
                      </div>
                    </div>
                    <div className="mt-auto space-y-2">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="source-label">Source label</label>
                      <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]" id="source-label" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoSamples.map((sample) => {
                    const isActive = sample.id === selectedSampleId;
                    return (
                      <button key={sample.id} onClick={() => loadSample(sample.id)} type="button" className={`rounded-[18px] border px-3 py-3 text-left transition ${isActive ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(20,184,166,0.2)]" : "border-slate-200 bg-white/60 hover:border-[var(--accent)]/45"}`}>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{sample.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="csv-text">Binder ledger (CSV)</label>
                  <textarea className="min-h-[310px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 font-mono text-sm leading-7 text-slate-700 outline-none transition focus:border-[var(--accent)]" id="csv-text" onChange={(event) => setCsvText(event.target.value)} value={csvText} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="question">Query prompt</label>
                  <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]" id="question" onChange={(event) => setQuestion(event.target.value)} value={question} />
                </div>
                <div className="space-y-3">
                  <button className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(15,118,110,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65" disabled={isPending} onClick={submit} type="button">
                    {isPending ? "Analyzing..." : "Analyze binder"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic capacity, concentration, and forecast threshold checks through the app route.</p>
                </div>
                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Capacity overview">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Binder: {result.analysis.summary.binderName}</li>
                <li>Capacity: {formatCurrency(result.analysis.summary.capacityGbp)}</li>
                <li>Used today: {formatCurrency(result.analysis.summary.usedGbp)} ({formatPercent(result.analysis.summary.usedPct)})</li>
                <li>Remaining today: {formatCurrency(result.analysis.summary.remainingGbp)}</li>
                <li>Forecast used: {formatCurrency(result.analysis.summary.forecastUsedGbp)} ({formatPercent(result.analysis.summary.forecastUsedPct)})</li>
                <li>Breach risk: {result.analysis.summary.breachRisk.replace(/_/g, " ")}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view binder metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Threshold flags">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <WarningList warnings={result.analysis.warnings} />
              ) : (
                <p className="text-sm text-emerald-700">No current threshold warning is active for this binder ledger.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings will appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Utilization" title="Current vs forecast bands">
          {result ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <BandMeter title="Current utilization" pct={result.analysis.summary.usedPct} band={result.analysis.summary.currentBand} />
              <BandMeter title="Forecast utilization" pct={result.analysis.summary.forecastUsedPct} band={result.analysis.summary.forecastBand} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Utilization bands will render after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Classes" title="Class concentration split">
            {result ? <BreakdownList metrics={result.analysis.classBreakdown} /> : <p className="text-sm text-slate-500">Class concentration appears after analysis.</p>}
          </Card>
          <Card eyebrow="Territories" title="Territory concentration split">
            {result ? <BreakdownList metrics={result.analysis.territoryBreakdown} /> : <p className="text-sm text-slate-500">Territory concentration appears after analysis.</p>}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card eyebrow="Risks" title="Largest bound and forecast positions">
            {result ? <TopRisksTable rows={result.analysis.topRisks} /> : <p className="text-sm text-slate-500">Top risks render after analysis.</p>}
          </Card>
          <Card eyebrow="Commentary" title="Binder manager readout">
            {result ? (
              <div className="space-y-4 text-sm leading-6 text-slate-700">
                <p className="text-base font-semibold text-slate-900">{result.analysis.commentary.executiveSummary}</p>
                <Section title="Observations" items={result.analysis.commentary.observations} />
                <Section title="Actions" items={result.analysis.commentary.actions} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Commentary will render after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Query" title="Prompt match snippets">
          {result ? (
            result.analysis.queryHits.length > 0 ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {result.analysis.queryHits.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No matched snippets were found for this query.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">Matched snippets will render after analysis.</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function WarningList({ warnings }: { warnings: BinderWarning[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-slate-700">
      {warnings.map((warning) => (
        <li className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2" key={warning.code}>
          <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">!</span>
          <span>{warning.message}</span>
        </li>
      ))}
    </ul>
  );
}

function BandMeter({ title, pct, band }: { title: string; pct: number; band: "green" | "amber" | "red" }) {
  const tone = band === "red" ? "bg-red-500" : band === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const badge = band === "red" ? "bg-red-50 text-red-700 border-red-200" : band === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="space-y-3 rounded-[22px] border border-slate-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${badge}`}>{band}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-sm text-slate-600">{formatPercent(pct)} of delegated authority consumed.</p>
    </div>
  );
}

function BreakdownList({ metrics }: { metrics: BreakdownMetric[] }) {
  return (
    <div className="space-y-3">
      {metrics.slice(0, 5).map((item) => (
        <div key={item.label} className="space-y-2 rounded-[18px] border border-slate-200 bg-white/70 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{formatPercent(item.sharePct)}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(item.sharePct, 100)}%` }} />
          </div>
          <p className="text-sm text-slate-600">Current {formatCurrency(item.amountGbp)} | Forecast {formatCurrency(item.forecastAmountGbp)}</p>
        </div>
      ))}
    </div>
  );
}

function TopRisksTable({ rows }: { rows: TopRiskMetric[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-2 py-2">Risk</th>
            <th className="px-2 py-2">Class</th>
            <th className="px-2 py-2">Territory</th>
            <th className="px-2 py-2">Bound</th>
            <th className="px-2 py-2">Forecast</th>
            <th className="px-2 py-2">Share</th>
            <th className="px-2 py-2">Days</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-slate-100" key={row.riskId}>
              <td className="px-2 py-2">
                <p className="font-semibold">{row.insuredName}</p>
                <p className="text-xs text-slate-500">{row.riskId} | {row.status}</p>
              </td>
              <td className="px-2 py-2">{row.classOfBusiness}</td>
              <td className="px-2 py-2">{row.territory}</td>
              <td className="px-2 py-2">{formatCurrency(row.boundAmountGbp)}</td>
              <td className="px-2 py-2">{formatCurrency(row.forecastExposureGbp)}</td>
              <td className="px-2 py-2">{formatPercent(row.sharePct)}</td>
              <td className="px-2 py-2">{row.daysToExpiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

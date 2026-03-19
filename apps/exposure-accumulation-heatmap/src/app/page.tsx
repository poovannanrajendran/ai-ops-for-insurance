"use client";

import { AppGroupLogo, Card, ExposureHeatmapLogo } from "@ai-ops/common-ui";
import { WorldExposureMap } from "@/components/world-exposure-map";
import { demoSamples } from "@/lib/demo-samples";
import type { ExposureInsight } from "@/types/exposure-heatmap";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: ExposureInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Exposure Accumulation Heatmap";

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

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState<string>(demoSamples[0].csvText);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState<string>("Which country concentration and hotspots need referral review?");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/exposureheatmap/analyze", {
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
      setError("error" in data ? data.error : "Exposure heatmap analysis failed.");
      return;
    }

    setAnalysisTimeMs(
      typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(performance.now() - startedAt)
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
    setCsvText(sample.csvText);
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
      const text = typeof reader.result === "string" ? reader.result : "";
      setCsvText(text);
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  const summary = result?.analysis.summary;

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
                  <ExposureHeatmapLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 6 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Upload or paste exposure CSV data with coordinates and TIV to identify accumulation hotspots, concentration warnings,
                  and reviewer actions.
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
              <MetaCard label="Mode" value="Exposure accumulation and hotspot review" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Exposure source and data">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Exposure source</label>
                  <div className="flex min-h-[280px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use sample CSVs, paste exposure data, or load a local `.csv` / `.txt` file.
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
                          accept=".csv,text/csv,.txt,text/plain"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]"
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
                        className={`rounded-[18px] border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(20,184,166,0.2)]"
                            : "border-slate-200 bg-white/60 hover:border-[var(--accent)]/45"
                        }`}
                        key={sample.id}
                        onClick={() => loadSample(sample.id)}
                        type="button"
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{sample.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="csv-text">
                    Exposure CSV
                  </label>
                  <textarea
                    className="min-h-[280px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-8 text-slate-700 outline-none transition focus:border-[var(--accent)]"
                    id="csv-text"
                    onChange={(event) => setCsvText(event.target.value)}
                    value={csvText}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="question">
                    Query prompt
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]"
                    id="question"
                    onChange={(event) => setQuestion(event.target.value)}
                    value={question}
                  />
                </div>

                <div className="space-y-3">
                  <button
                    className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(15,118,110,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Analyzing..." : "Analyze accumulation"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic CSV checks and Day 6 hotspot analysis through the app route.</p>
                </div>

                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Accumulation overview">
            {summary ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Total rows: {summary.rowCount}</li>
                <li>Total TIV: {summary.totalTiv.toLocaleString("en-GB")}</li>
                <li>Largest location TIV: {summary.maxLocationTiv.toLocaleString("en-GB")}</li>
                <li>Hotspots: {summary.hotspotCount}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view exposure accumulation metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Review triggers">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.warnings.map((warning) => (
                    <li className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2" key={warning.code}>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
                      >
                        !
                      </span>
                      <span>⚠ {warning.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">No warning triggers for this accumulation run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings will appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Hotspots" title="Top concentration zones">
          {result ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Rank</th>
                    <th className="px-2 py-2">Country</th>
                    <th className="px-2 py-2">Locations</th>
                    <th className="px-2 py-2">Total TIV</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.hotspots.map((item) => (
                    <tr className="border-b border-slate-100" key={`${item.country}-${item.rank}`}>
                      <td className="px-2 py-2">{item.rank}</td>
                      <td className="px-2 py-2">{item.country}</td>
                      <td className="px-2 py-2">{item.locationCount}</td>
                      <td className="px-2 py-2">{item.totalTiv.toLocaleString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Hotspot ranking will render after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Concentration" title="Country concentration split">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {result.analysis.countryConcentration.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.totalTiv.toLocaleString("en-GB")} ({item.sharePct}%)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Country concentration metrics will appear after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Query snippets will appear here after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Heatmap" title="World exposure heatmap">
          {result ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Circles represent insured locations. Size and color intensity scale with relative TIV.
              </p>
              <WorldExposureMap points={result.analysis.heatPoints} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Run an analysis to render map points and intensity.</p>
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

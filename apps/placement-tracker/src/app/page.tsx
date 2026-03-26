"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useMemo, useRef, useState } from "react";

import { PlacementTrackerLogo } from "@/components/placement-tracker-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { PlacementInsight } from "@/types/placement-tracker";

interface AnalyzeResponse {
  analysis: PlacementInsight;
  persistence: {
    reason?: string;
    status: "stored" | "failed" | "skipped";
  };
  processingTimeMs: number;
  requestId: string;
}

type ViewMode = "table" | "kanban";

function formatDuration(ms: number | null): string {
  if (ms == null) {
    return "00:00:00";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remSeconds = String(seconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${remSeconds}:${centiseconds}`;
}

function Dot({ tone }: { tone: "ok" | "warn" | "issue" }) {
  const color = tone === "ok" ? "#15803d" : tone === "warn" ? "#d97706" : "#dc2626";
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

function formatLineGbp(value: number): string {
  return `£${(value / 1_000_000).toFixed(1)}m`;
}

function formatSignedPercent(value: number): string {
  return value > 0 ? `+${value}%` : `${value}%`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function priorityRank(priority: PlacementInsight["marketProgression"][number]["priority"]): number {
  if (priority === "critical") {
    return 3;
  }
  if (priority === "watch") {
    return 2;
  }
  return 1;
}

function laneAccent(status: "placed" | "open"): string {
  return status === "placed" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700";
}

function statusPillClass(status: PlacementInsight["marketProgression"][number]["status"]): string {
  if (status === "placed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "quoted") {
    return "bg-sky-100 text-sky-800";
  }
  if (status === "follow-up") {
    return "bg-amber-100 text-amber-800";
  }
  if (status === "declined") {
    return "bg-rose-100 text-rose-800";
  }
  if (status === "hold") {
    return "bg-zinc-200 text-zinc-700";
  }
  return "bg-slate-200 text-slate-700";
}

function statusColumnClass(status: PlacementInsight["marketProgression"][number]["status"]): string {
  if (status === "placed") {
    return "border-emerald-200 bg-emerald-50/65";
  }
  if (status === "quoted") {
    return "border-sky-200 bg-sky-50/70";
  }
  if (status === "follow-up") {
    return "border-amber-200 bg-amber-50/70";
  }
  if (status === "declined") {
    return "border-rose-200 bg-rose-50/70";
  }
  if (status === "hold") {
    return "border-zinc-200 bg-zinc-100/70";
  }
  return "border-slate-200 bg-slate-50/70";
}

function priorityDotClass(priority: PlacementInsight["marketProgression"][number]["priority"]): string {
  if (priority === "critical") {
    return "bg-rose-500";
  }
  if (priority === "watch") {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
}

function followUpAgeClass(followUpAgeDays: number): string {
  if (followUpAgeDays >= 5) {
    return "text-rose-600";
  }
  if (followUpAgeDays >= 3) {
    return "text-amber-600";
  }
  return "text-slate-600";
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState<string>(demoSamples[0].csvText);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const analysis = result?.analysis;
  const sortedMarkets = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return [...analysis.marketProgression].sort((left, right) => {
      const rankDelta = priorityRank(right.priority) - priorityRank(left.priority);
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return right.targetSharePct - left.targetSharePct;
    });
  }, [analysis]);

  const projectedWidthPct =
    analysis && analysis.summary.totalTargetSharePct > 0
      ? clampPercent((analysis.summary.projectedSharePct / analysis.summary.totalTargetSharePct) * 100)
      : 0;
  const placedWidthPct =
    analysis && analysis.summary.totalTargetSharePct > 0
      ? clampPercent((analysis.summary.placedSharePct / analysis.summary.totalTargetSharePct) * 100)
      : 0;

  const kanbanStatuses: Array<PlacementInsight["marketProgression"][number]["status"]> = [
    "open",
    "quoted",
    "follow-up",
    "placed",
    "declined",
    "hold"
  ];
  const kanbanColumns = kanbanStatuses
    .map((status) => ({
      markets: sortedMarkets.filter((market) => market.status === status),
      status
    }))
    .filter((column) => column.markets.length > 0);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/placementtracker/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText, question, sourceLabel })
    });
    const payload = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in payload) {
      setResult(null);
      setError("error" in payload ? payload.error : "Placement analysis failed.");
      return;
    }
    setResult(payload);
    setAnalysisTimeMs(payload.processingTimeMs ?? Math.round(performance.now() - startedAt));
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
    if (!sample) {
      return;
    }
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setQuestion(sample.question);
    setCsvText(sample.csvText);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setCsvText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read the selected file.");
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
                  <PlacementTrackerLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 18 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">30 Useful Insurance and Productivity Apps | Placement Tracker</p>
                </div>
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">Placement Tracker</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                Score placement progression deterministically, spotlight stale follow-ups, and prioritise market actions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={result ? (result.persistence.status === "stored" ? "Supabase synced" : result.persistence.status === "failed" ? "Needs attention" : "Pending credentials") : "Awaiting run"} />
              <MetaCard label="Mode" value="Placement progression and priority scoring" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Placement source and content">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Placement source</label>
                <div className="rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Use built-in CSV samples, paste placement rows, or load a local `.csv` / `.txt` extract.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={() => fileInputRef.current?.click()} type="button">
                      Select File
                    </button>
                    <input accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
                    <button className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-700" onClick={() => loadSample(demoSamples[0].id)} type="button">
                      Reset sample
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Source label</label>
                    <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {demoSamples.map((sample) => (
                  <button className={`rounded-3xl border px-4 py-3 text-left transition ${selectedSampleId === sample.id ? "border-[var(--accent)] bg-[var(--accent-soft)]/70" : "border-slate-200 bg-white/70 hover:border-slate-300"}`} key={sample.id} onClick={() => loadSample(sample.id)} type="button">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{sample.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Placement CSV</label>
              <textarea className="min-h-[285px] w-full resize-y rounded-3xl border border-slate-300 bg-white/80 p-4 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" onChange={(event) => setCsvText(event.target.value)} value={csvText} />
              <label className="block text-sm font-semibold text-slate-700">Query prompt</label>
              <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700" onChange={(event) => setQuestion(event.target.value)} value={question} />
              <button className="inline-flex min-w-[190px] items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending || csvText.trim().length < 180} onClick={submit} type="button">
                {isPending ? "Running..." : "Track placement"}
              </button>
              <p className="text-sm text-slate-500">Runs deterministic placement checks through the app route.</p>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              {result?.persistence.status === "failed" && result.persistence.reason ? (
                <p className="text-sm font-medium text-amber-700">{result.persistence.reason}</p>
              ) : null}
            </div>
          </div>
        </Card>

        {result ? (
          <div className="grid gap-5 md:grid-cols-2">
            {result.analysis.statusLanes.map((lane) => (
              <Card eyebrow={lane.label} key={lane.status} title="Status lane">
                <div className="space-y-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${laneAccent(lane.status)}`}>
                    {lane.label}
                  </span>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Markets</dt>
                      <dd className="mt-1 text-base font-semibold text-slate-800">{lane.count}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Target share</dt>
                      <dd className="mt-1 text-base font-semibold text-slate-800">{lane.sharePct}%</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Avg follow-up age</dt>
                      <dd className="mt-1 text-base font-semibold text-slate-800">{lane.avgFollowUpAgeDays}d</dd>
                    </div>
                  </dl>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {result && result.analysis.queryHits.length > 0 ? (
          <Card eyebrow="Search" title={`Query: "${question}"`}>
            <details className="group rounded-2xl border border-slate-200 bg-white/70 p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Matching lines ({result.analysis.queryHits.length})</summary>
              <div className="mt-3 space-y-2">
                {result.analysis.queryHits.map((line) => (
                  <code className="block rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700" key={line}>
                    {line}
                  </code>
                ))}
              </div>
            </details>
          </Card>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <Card eyebrow="Summary" title="Placement overview">
            {result ? (
              <div className="space-y-3 text-sm text-slate-700">
                <p>Placed share: {result.analysis.summary.placedSharePct}%</p>
                <p>Open share: {result.analysis.summary.openSharePct}%</p>
                <p>Projected share: {result.analysis.summary.projectedSharePct}%</p>
                <p>Critical flags: {result.analysis.priorityFlags.filter((flag) => flag.severity === "critical").length}</p>
                <div className="space-y-2 pt-2">
                  <div className="relative h-4 overflow-hidden rounded-full bg-slate-100">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-sky-300" style={{ width: `${projectedWidthPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: `${placedWidthPct}%` }} />
                    <span aria-hidden="true" className="absolute inset-y-0 right-0 w-px bg-slate-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    <p className="text-emerald-700">Placed {result.analysis.summary.placedSharePct}%</p>
                    <p className="text-sky-700">Projected {result.analysis.summary.projectedSharePct}%</p>
                    <p className="text-slate-600">Target {result.analysis.summary.totalTargetSharePct}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run analysis to view placement metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Priority flags">
            {result && result.analysis.priorityFlags.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {result.analysis.priorityFlags.map((flag) => (
                  <li className="rounded-2xl border border-slate-200 bg-white/70 p-3" key={`${flag.code}-${flag.marketName ?? "global"}`}>
                    <p className="flex items-center gap-2 font-semibold">
                      <Dot tone={flag.severity === "critical" ? "issue" : flag.severity === "watch" ? "warn" : "ok"} />
                      {flag.title}
                    </p>
                    <p className="mt-1 text-slate-600">{flag.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No priority flags detected in this run.</p>
            )}
          </Card>
        </div>

        {result ? (
          <Card eyebrow="Markets" title="Market progression">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sorted by priority: critical, watch, stable</p>
                <div className="inline-flex rounded-full border border-slate-300 bg-white p-1">
                  <button
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      viewMode === "table" ? "bg-[var(--accent)] text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    onClick={() => setViewMode("table")}
                    type="button"
                  >
                    Table
                  </button>
                  <button
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      viewMode === "kanban" ? "bg-[var(--accent)] text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    onClick={() => setViewMode("kanban")}
                    type="button"
                  >
                    Kanban
                  </button>
                </div>
              </div>

              {viewMode === "table" ? (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70 hidden md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          <th className="px-3 py-3">Market</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Priority</th>
                          <th className="px-3 py-3">Target line</th>
                          <th className="px-3 py-3">Signed</th>
                          <th className="px-3 py-3">Projected</th>
                          <th className="px-3 py-3">Remaining</th>
                          <th className="px-3 py-3">Follow-up age</th>
                          <th className="px-3 py-3">Capacity change</th>
                          <th className="px-3 py-3">Broker</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMarkets.map((market) => {
                          const remainingClass =
                            market.remainingSharePct > 0 && market.status !== "placed"
                              ? market.remainingSharePct >= 10
                                ? "text-rose-600"
                                : "text-amber-600"
                              : "text-slate-700";
                          const capacityClass =
                            market.capacityChangePct < 0
                              ? "text-rose-600"
                              : market.capacityChangePct > 0
                                ? "text-emerald-600"
                                : "text-slate-600";

                          return (
                            <tr className="border-t border-slate-200 text-slate-700" key={`${market.marketName}-${market.status}`}>
                              <td className="px-3 py-3 font-semibold text-slate-900">{market.marketName}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusPillClass(market.status)}`}>{market.status}</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-2 text-xs font-semibold capitalize text-slate-700">
                                  <span className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(market.priority)}`} />
                                  {market.priority}
                                </span>
                              </td>
                              <td className="px-3 py-3">{formatLineGbp(market.targetLineGbp)}</td>
                              <td className="px-3 py-3">{formatLineGbp(market.signedLineGbp)}</td>
                              <td className="px-3 py-3">{formatLineGbp(market.projectedLineGbp)}</td>
                              <td className={`px-3 py-3 font-semibold ${remainingClass}`}>{market.remainingSharePct}%</td>
                              <td className={`px-3 py-3 font-semibold ${followUpAgeClass(market.followUpAgeDays)}`}>{market.followUpAgeDays}d</td>
                              <td className={`px-3 py-3 font-semibold ${capacityClass}`}>{formatSignedPercent(market.capacityChangePct)}</td>
                              <td className="px-3 py-3">{market.broker}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {sortedMarkets.map((market) => {
                      const remainingClass =
                        market.remainingSharePct > 0 && market.status !== "placed"
                          ? market.remainingSharePct >= 10
                            ? "text-rose-600"
                            : "text-amber-600"
                          : "text-slate-700";
                      const capacityClass =
                        market.capacityChangePct < 0
                          ? "text-rose-600"
                          : market.capacityChangePct > 0
                            ? "text-emerald-600"
                            : "text-slate-600";
                      return (
                        <article className="rounded-3xl border border-slate-200 bg-white/75 p-4" key={`${market.marketName}-mobile`}>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{market.marketName}</h3>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold capitalize ${statusPillClass(market.status)}`}>
                              {market.status}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
                            <p>
                              <span className="font-semibold">Priority:</span>{" "}
                              <span className="inline-flex items-center gap-1 capitalize">
                                <span className={`h-2 w-2 rounded-full ${priorityDotClass(market.priority)}`} />
                                {market.priority}
                              </span>
                            </p>
                            <p>
                              <span className="font-semibold">Target:</span> {formatLineGbp(market.targetLineGbp)}
                            </p>
                            <p>
                              <span className="font-semibold">Signed:</span> {formatLineGbp(market.signedLineGbp)}
                            </p>
                            <p>
                              <span className="font-semibold">Projected:</span> {formatLineGbp(market.projectedLineGbp)}
                            </p>
                            <p className={remainingClass}>
                              <span className="font-semibold text-slate-700">Remaining:</span> {market.remainingSharePct}%
                            </p>
                            <p className={followUpAgeClass(market.followUpAgeDays)}>
                              <span className="font-semibold text-slate-700">Follow-up:</span> {market.followUpAgeDays}d
                            </p>
                            <p className={capacityClass}>
                              <span className="font-semibold text-slate-700">Capacity:</span> {formatSignedPercent(market.capacityChangePct)}
                            </p>
                            <p>
                              <span className="font-semibold">Broker:</span> {market.broker}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {kanbanColumns.map((column) => (
                    <section className={`min-w-[16rem] flex-1 rounded-3xl border p-4 ${statusColumnClass(column.status)}`} key={column.status}>
                      <header className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold capitalize text-slate-900">{column.status}</h3>
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700">{column.markets.length}</span>
                      </header>
                      <div className="space-y-2.5">
                        {column.markets.map((market) => (
                          <article className="rounded-2xl border border-white/60 bg-white/80 p-3" key={`${column.status}-${market.marketName}`}>
                            <p className="text-sm font-semibold text-slate-900">{market.marketName}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {market.signedSharePct}% / {market.targetSharePct}%
                            </p>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className={`rounded-full bg-white px-2 py-1 font-semibold ${followUpAgeClass(market.followUpAgeDays)}`}>{market.followUpAgeDays}d</span>
                              <span className="inline-flex items-center gap-1 capitalize text-slate-700">
                                <span className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(market.priority)}`} />
                                {market.priority}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : null}

        {result ? (
          <Card eyebrow="Briefing" title="Placement commentary">
            <div className="space-y-5">
              <p className="text-sm leading-7 text-slate-700">{result.analysis.commentary.executiveSummary}</p>
              <hr className="border-slate-200" />
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Observations</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {result.analysis.commentary.observations.map((observation) => (
                      <li key={observation}>{"\u2192"} {observation}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Actions</p>
                  <ol className="space-y-2 text-sm text-slate-700">
                    {result.analysis.commentary.actions.map((action, index) => (
                      <li className="flex items-start gap-3" key={action}>
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

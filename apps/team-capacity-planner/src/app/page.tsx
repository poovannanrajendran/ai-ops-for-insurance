"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { TeamCapacityLogo } from "@/components/team-capacity-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { TeamCapacityInsight } from "@/types/team-capacity";

interface AnalyzeResponse {
  analysis: TeamCapacityInsight;
  persistence: { status: string; reason?: string };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Team Capacity Planner";
const appProjectName = "30 Useful Insurance and Productivity Apps";

function formatDuration(ms: number | null): string {
  if (ms == null) return "00:00:00";
  const totalMilliseconds = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((totalMilliseconds % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${seconds}:${centiseconds}`;
}

function statusAppearance(status: string): { dotClass: string; label: string } {
  if (status === "stored") return { dotClass: "bg-emerald-600", label: "Supabase synced" };
  if (status === "failed") return { dotClass: "bg-red-600", label: "Needs attention" };
  return { dotClass: "bg-amber-500", label: "Awaiting run" };
}

function capacityAppearance(state: TeamCapacityInsight["summary"]["capacityState"] | null) {
  if (state === "healthy") return { dotClass: "bg-emerald-500", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "Healthy" };
  if (state === "overloaded") return { dotClass: "bg-red-500", badgeClass: "bg-red-50 border-red-200 text-red-700", label: "Overloaded" };
  if (state === "watch") return { dotClass: "bg-amber-500", badgeClass: "bg-amber-50 border-amber-200 text-amber-700", label: "Watch" };
  return { dotClass: "bg-slate-400", badgeClass: "bg-slate-100 border-slate-200 text-slate-500", label: "Not run yet" };
}

function priorityAppearance(priority: "critical" | "high" | "normal") {
  if (priority === "critical") return { dot: "bg-red-500", badge: "bg-red-50 border-red-200 text-red-700" };
  if (priority === "high") return { dot: "bg-amber-500", badge: "bg-amber-50 border-amber-200 text-amber-700" };
  return { dot: "bg-slate-400", badge: "bg-slate-100 border-slate-200 text-slate-500" };
}

function MiniBar({ label, value, max, warnPct, critPct, unit = "%" }: {
  label: string;
  value: number;
  max: number;
  warnPct: number;
  critPct: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor =
    pct >= critPct ? "bg-red-500" : pct >= warnPct ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${pct >= critPct ? "text-red-600" : pct >= warnPct ? "text-amber-600" : "text-emerald-700"}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [capacityText, setCapacityText] = useState(demoSamples[0].capacityText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");
  const capacity = capacityAppearance(result?.analysis.summary.capacityState ?? null);
  const activeFileDisplay = sourceLabel.replace(/\.[a-z0-9]+$/i, "").replace(/capacity|team/gi, "").trim();

  async function runAnalysis() {
    const startedAt = globalThis.performance.now();
    const response = await fetch("/api/teamcapacity/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacityText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Team capacity analysis failed.");
      return;
    }

    setAnalysisTimeMs(
      typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(globalThis.performance.now() - startedAt)
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

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCapacityText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setCapacityText(sample.capacityText);
    setQuestion(sample.question);
    setError(null);
  }

  const dm = result?.analysis.derived;
  const fields = result?.analysis.extractedFields;

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(21,51,72,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(21,51,72,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <TeamCapacityLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 27 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">{appProjectName} | {appName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Convert team workload and staffing signals into deterministic capacity states, utilization metrics,
                  SLA posture, and priority-ranked allocation actions.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current file" value={activeFileDisplay} />
              <MetaCard label="Capacity state" value={capacity.label} dotClass={capacity.dotClass} />
              <MetaCard label="Storage" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic capacity allocation" />
            </div>
          </div>
        </section>

        {/* Intake */}
        <Card eyebrow="Intake" title="Team capacity intake and prompt">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Capacity source</p>
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Paste key-value lines for workforce fields — for example{" "}
                  <code>available_capacity_fte</code>, <code>sla_breach_count</code>, <code>referral_backlog</code>.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <input className="hidden" onChange={handleFileSelection} ref={fileRef} type="file" />
                  <button
                    className="rounded-full bg-slate-950 px-6 py-2.5 text-base font-semibold text-white"
                    onClick={() => fileRef.current?.click()}
                    type="button"
                  >
                    Select File
                  </button>
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="sourceLabel">
                  Source label
                </label>
                <input
                  className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                  id="sourceLabel"
                  onChange={(event) => setSourceLabel(event.target.value)}
                  value={sourceLabel}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {demoSamples.map((sample) => {
                  const active = selectedSampleId === sample.id;
                  return (
                    <button
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(15,118,110,0.12)]"
                          : "border-[var(--panel-border)] bg-white/70 hover:border-[var(--accent)]/45"
                      }`}
                      key={sample.id}
                      onClick={() => loadSample(sample.id)}
                      type="button"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{sample.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{sample.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Capacity dataset</p>
              <div className="rounded-[20px] border border-slate-200 bg-white/65 p-4">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="capacityText">
                  Capacity ledger
                </label>
                <textarea
                  className="mt-2 h-[310px] w-full resize-none rounded-[16px] border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none"
                  id="capacityText"
                  onChange={(event) => setCapacityText(event.target.value)}
                  value={capacityText}
                />
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="questionInput">
                  Query prompt
                </label>
                <input
                  className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                  id="questionInput"
                  onChange={(event) => setQuestion(event.target.value)}
                  value={question}
                />
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    className="w-full rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Running..." : "Analyze team capacity"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Deterministic capacity scoring — utilization, SLA posture, priority-ranked actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <Card eyebrow="Warnings" title="Validation">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          </Card>
        ) : null}

        {/* Summary + Derived metrics — visual layout */}
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Summary card — Option A: state badge + 3 mini-bars */}
          <Card eyebrow="Summary" title="Capacity overview">
            <div className="flex h-full flex-col gap-5">
              {/* State badge row */}
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${capacity.badgeClass}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${capacity.dotClass}`} />
                  {result ? result.analysis.summary.capacityState.toUpperCase() : "NOT RUN"}
                </span>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">{result ? `${result.analysis.summary.completenessPct}%` : "—"}</span>
                    {" "}complete
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900">{result ? result.analysis.summary.confidence : "—"}</span>
                    {" "}confidence
                  </span>
                  <span>
                    <span className={`font-semibold ${(result?.analysis.summary.warnings ?? 0) > 0 ? "text-red-600" : "text-slate-900"}`}>
                      {result ? result.analysis.summary.warnings : "—"}
                    </span>
                    {" "}warning{result?.analysis.summary.warnings !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* 3 mini-bars */}
              <div className="space-y-4 rounded-[16px] border border-slate-100 bg-slate-50/60 px-4 py-4">
                <MiniBar
                  label={`Utilization — ${dm ? `${dm.effectiveFte} FTE / ${result?.analysis.extractedFields.in_flight_work_items ?? 0} items` : "FTE vs items"}`}
                  value={dm ? Math.round(dm.utilizationRate * 10) : 0}
                  max={50}
                  warnPct={40}
                  critPct={70}
                  unit="×"
                />
                <MiniBar
                  label={`Urgent queue${fields ? ` — ${fields.urgent_queue ?? 0} of ${fields.in_flight_work_items ?? 0} items` : ""}`}
                  value={dm && fields ? Math.round(((fields.urgent_queue ?? 0) / Math.max(1, fields.in_flight_work_items ?? 1)) * 100) : 0}
                  max={100}
                  warnPct={20}
                  critPct={40}
                />
                <MiniBar
                  label={`Overtime${fields ? ` — ${fields.overtime_pct ?? 0}%` : ""}`}
                  value={fields?.overtime_pct ?? 0}
                  max={30}
                  warnPct={33}
                  critPct={60}
                />
              </div>

              {/* SLA breach + velocity row */}
              {dm ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">SLA breach rate</p>
                    <p className={`mt-1 text-xl font-semibold ${dm.slaBreachRatePct >= 20 ? "text-red-600" : "text-slate-900"}`}>
                      {dm.slaBreachRatePct}%
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Queue velocity</p>
                    <p className={`mt-1 text-xl font-semibold ${dm.queueVelocityDelta > 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {dm.queueVelocityDelta > 0 ? `+${dm.queueVelocityDelta}` : dm.queueVelocityDelta} items/wk
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">SLA breach rate</p>
                    <p className="mt-1 text-xl font-semibold text-slate-400">—</p>
                  </div>
                  <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Queue velocity</p>
                    <p className="mt-1 text-xl font-semibold text-slate-400">—</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Derived metrics card */}
          <Card eyebrow="Metrics" title="Derived capacity metrics">
            {dm && fields ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Effective FTE" value={String(dm.effectiveFte)} sub={fields.absentee_count ? `${fields.absentee_count} absentee(s) excluded` : "Full team available"} />
                <MetricTile label="Utilization rate" value={`${dm.utilizationRate}×`} sub={`${dm.utilizationPct}% of 4× ceiling`} />
                <MetricTile
                  label="Cycle vs target"
                  value={dm.cycleVsTarget != null ? (dm.cycleVsTarget > 0 ? `+${dm.cycleVsTarget}d lagging` : "On target") : "No target set"}
                  sub={fields.avg_cycle_days != null ? `${fields.avg_cycle_days} day avg` : ""}
                />
                <MetricTile
                  label="Capacity runway"
                  value={dm.capacityRunwayDays != null ? `${dm.capacityRunwayDays} day(s)` : "Stable"}
                  sub={dm.capacityRunwayDays != null && dm.capacityRunwayDays < 5 ? "⚠ Ceiling imminent" : "At current intake rate"}
                />
                <MetricTile label="Referral backlog" value={String(fields.referral_backlog ?? 0)} sub="items pending referral" />
                <MetricTile label="New submissions" value={String(fields.new_submissions_week ?? "—")} sub="this week" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Derived metrics appear after analysis.</p>
            )}
          </Card>
        </div>

        {/* Narrative + Action plan */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Narrative" title="Allocation narrative">
            {result?.analysis.allocationNarrative.length ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {result.analysis.allocationNarrative.map((line, index) => (
                  <li className="rounded-[12px] border border-slate-100 bg-slate-50/60 px-3 py-2.5" key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Narrative appears after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Actions" title="Priority-ranked action plan">
            {result?.analysis.actionPlan.length ? (
              <ul className="space-y-2">
                {result.analysis.actionPlan.map((item, index) => {
                  const p = priorityAppearance(item.priority);
                  return (
                    <li className="flex items-start gap-3 rounded-[12px] border border-slate-100 bg-white px-3 py-2.5" key={`action-${index}`}>
                      <span className={`mt-1 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${p.badge}`}>
                        {item.priority}
                      </span>
                      <span className="text-sm leading-6 text-slate-700">{item.action}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Action plan appears after analysis.</p>
            )}
            {result?.analysis.warnings.length ? (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-red-700">
                {result.analysis.warnings.map((warning, index) => (
                  <li className="rounded-xl border border-red-200 bg-red-50 px-3 py-2" key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>

        {/* Query hits */}
        <Card eyebrow="Query" title="Prompt match snippets">
          {result?.analysis.promptHits.length ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {result.analysis.promptHits.map((line, index) => (
                <li className="rounded-[12px] border border-slate-100 bg-slate-50/60 px-3 py-2" key={`${line}-${index}`}>— {line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
          )}
        </Card>

        {/* Whitespace table */}
        <Card eyebrow="Whitespace" title="Field extraction table">
          {result?.analysis.whitespaceRows.length ? (
            <div className="overflow-hidden rounded-[18px] border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Field</th>
                    <th className="px-4 py-2.5">Extracted value</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.whitespaceRows.map((row, index) => (
                    <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"} key={`${row.fieldWording}-${index}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {row.fieldWording}
                        {row.optional ? <span className="ml-2 text-[0.65rem] font-normal text-slate-400">optional</span> : null}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{row.extractedValue || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                            row.status === "EXTRACTED"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : row.optional
                                ? "border border-slate-200 bg-slate-100 text-slate-500"
                                : "border border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {row.status === "MISSING" && row.optional ? "OPTIONAL" : row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Field extraction table appears after analysis.</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetaCard({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <article className="rounded-[18px] border border-[var(--panel-border)] bg-white/80 px-4 py-3">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
        {dotClass ? <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} /> : null}
        {value}
      </p>
    </article>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-[0.7rem] text-slate-400">{sub}</p> : null}
    </div>
  );
}

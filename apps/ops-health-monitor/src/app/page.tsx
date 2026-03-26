"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { OpsHealthMonitorLogo } from "@/components/ops-health-monitor-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { OpsHealthInsight, Severity } from "@/types/ops-health";

interface AnalyzeResponse {
  analysis: OpsHealthInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Ops Health Monitor";
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

function overallStateAppearance(state: OpsHealthInsight["summary"]["overallState"] | null) {
  if (state === "critical") return { dotClass: "bg-red-600", label: "Critical" };
  if (state === "watch") return { dotClass: "bg-amber-500", label: "Watch" };
  if (state === "stable") return { dotClass: "bg-emerald-600", label: "Stable" };
  return { dotClass: "bg-slate-400", label: "Not run yet" };
}

function severityClasses(severity: Severity): string {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [kpiText, setKpiText] = useState(demoSamples[0].kpiText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");
  const health = overallStateAppearance(result?.analysis.summary.overallState ?? null);
  const activeFileDisplay = sourceLabel.replace(/\.[a-z0-9]+$/i, "");

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/opshealth/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kpiText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Ops health analysis failed.");
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
      .finally(() => setIsPending(false));
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setKpiText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setKpiText(sample.kpiText);
    setQuestion(sample.question);
    setError(null);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(21,51,72,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(21,51,72,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <OpsHealthMonitorLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 23 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Evaluate operational KPI health, surface anomalies, and produce a concise action briefing for weekly
                  leadership cadence.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Active file" value={activeFileDisplay} />
              <MetaCard label="Ops state" value={health.label} dotClass={health.dotClass} />
              <MetaCard label="Storage state" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic KPI anomaly and briefing monitor" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Operations KPI feed and prompt">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">KPI source</p>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Provide KPI rows with <code>kpi,current,target,previous,owner,direction</code> where direction is
                  either <code>higher_better</code> or <code>lower_better</code>.
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

              <div className="grid gap-3 sm:grid-cols-3">
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
              <div className="rounded-[20px] border border-slate-200 bg-white/65 p-4">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="kpiText">
                  KPI ledger
                </label>
                <textarea
                  className="mt-2 h-[310px] w-full resize-none rounded-[16px] border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-7 text-slate-800 outline-none"
                  id="kpiText"
                  onChange={(event) => setKpiText(event.target.value)}
                  value={kpiText}
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
                    {isPending ? "Running..." : "Run ops health review"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Runs deterministic KPI parsing, anomaly scoring, and briefing generation.
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

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Ops health overview">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Metrics evaluated" value={result ? String(result.analysis.summary.metricsEvaluated) : "-"} />
              <MetricTile label="Overall state" value={result ? result.analysis.summary.overallState : "Not run yet"} />
              <MetricTile label="High risk count" value={result ? String(result.analysis.summary.highRiskCount) : "-"} />
              <MetricTile label="Medium risk count" value={result ? String(result.analysis.summary.mediumRiskCount) : "-"} />
            </div>
          </Card>

          <Card eyebrow="Warnings" title="Anomaly alerts">
            {result?.analysis.anomalyAlerts.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.anomalyAlerts.map((alert, index) => (
                  <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2" key={`${alert}-${index}`}>
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No anomalies to report yet.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Board" title="KPI score board">
            <div className="space-y-3">
              {result?.analysis.metricBoard.length ? (
                result.analysis.metricBoard.map((metric, index) => (
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-3" key={`${metric.name}-${index}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{metric.name}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${severityClasses(metric.severity)}`}>
                        {metric.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Owner: {metric.owner} · Current {metric.current} · Target {metric.target} · Gap {metric.deltaToTargetPct}%
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">KPI score board appears after analysis.</p>
              )}
            </div>
          </Card>

          <Card eyebrow="Briefing" title="Narrative and actions">
            <div className="space-y-4">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Executive narrative</p>
                {result?.analysis.briefingNarrative.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    {result.analysis.briefingNarrative.map((line, index) => (
                      <li key={`${line}-${index}`}>- {line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Narrative appears after analysis.</p>
                )}
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action plan</p>
                {result?.analysis.actionPlan.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    {result.analysis.actionPlan.map((line, index) => (
                      <li key={`${line}-${index}`}>- {line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Action plan appears after analysis.</p>
                )}
              </section>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Query" title="Prompt match snippets">
            {result?.analysis.queryHits.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.queryHits.map((hit, index) => (
                  <li key={`${hit}-${index}`}>- {hit}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Governance flags">
            {result?.analysis.warnings.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.warnings.map((warning, index) => (
                  <li className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700" key={`${warning}-${index}`}>
                    {warning}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No governance warnings triggered in this run.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Whitespace" title="Whitespace wording table">
          {result?.analysis.whitespaceRows.length ? (
            <div className="overflow-hidden rounded-[18px] border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Field wording</th>
                    <th className="px-4 py-2.5">Extracted value</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.whitespaceRows.map((row, index) => (
                    <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"} key={`${row.fieldWording}-${index}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{row.fieldWording}</td>
                      <td className="px-4 py-2.5 text-slate-700">{row.extractedValue || "-"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                            row.status === "EXTRACTED"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Whitespace table appears after analysis.</p>
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

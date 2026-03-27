"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { LossRatioTriangulatorLogo } from "@/components/loss-ratio-triangulator-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { TriangleInsight } from "@/types/triangle";

interface AnalyzeResponse {
  analysis: TriangleInsight;
  persistence: { status: string; reason?: string };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Loss Ratio Triangulator";
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

function bandAppearance(band: TriangleInsight["summary"]["reservingBand"] | null): { dotClass: string; label: string } {
  if (band === "adequate") return { dotClass: "bg-emerald-600", label: "Adequate" };
  if (band === "watch") return { dotClass: "bg-amber-500", label: "Watch" };
  if (band === "strengthening-required") return { dotClass: "bg-red-600", label: "Strengthening required" };
  return { dotClass: "bg-slate-400", label: "Not run yet" };
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : "-";
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [triangleText, setTriangleText] = useState(demoSamples[0].triangleText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");
  const band = bandAppearance(result?.analysis.summary.reservingBand ?? null);

  async function runAnalysis() {
    const startedAt = globalThis.performance.now();
    const response = await fetch("/api/lossratiotriangulator/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triangleText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Triangle analysis failed.");
      return;
    }

    setAnalysisTimeMs(typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(globalThis.performance.now() - startedAt));
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
    reader.onload = () => setTriangleText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setTriangleText(sample.triangleText);
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
                  <LossRatioTriangulatorLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 30 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">{appProjectName} | {appName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Parse cumulative or incremental loss triangles, derive Chain-Ladder projections, and surface IBNR posture with deterministic reserving evidence.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current file" value={sourceLabel} />
              <MetaCard label="Reserving band" value={band.label} dotClass={band.dotClass} />
              <MetaCard label="Storage" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic chain-ladder and IBNR estimation" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Triangle source and query">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Paste triangle rows or upload a CSV/text extract. Optional line: <code>tail_factor=1.08</code>.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <input className="hidden" onChange={handleFileSelection} ref={fileRef} type="file" />
                  <button className="rounded-full bg-slate-950 px-6 py-2.5 text-base font-semibold text-white" onClick={() => fileRef.current?.click()} type="button">Select File</button>
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="sourceLabel">Source label</label>
                <input className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none" id="sourceLabel" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {demoSamples.map((sample) => {
                  const active = selectedSampleId === sample.id;
                  return (
                    <button
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${active ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(67,56,202,0.14)]" : "border-[var(--panel-border)] bg-white/70 hover:border-[var(--accent)]/45"}`}
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Triangle text</p>
                <textarea className="mt-2 h-[330px] w-full resize-none rounded-[16px] border-0 bg-transparent px-1 py-1 text-sm leading-7 text-slate-800 outline-none shadow-none" onChange={(event) => setTriangleText(event.target.value)} value={triangleText} />
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="questionInput">Query prompt</label>
                <input className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none" id="questionInput" onChange={(event) => setQuestion(event.target.value)} value={question} />
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button className="w-full rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white disabled:opacity-60" disabled={isPending} onClick={submit} type="button">{isPending ? "Running..." : "Run triangulation"}</button>
                  <p className="text-center text-sm text-slate-500">Runs deterministic chain-ladder projection and reserving checks.</p>
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
          <Card eyebrow="Summary" title="Reserving overview">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Total paid" value={result ? fmt(result.analysis.summary.totalPaid) : "-"} />
              <MetricTile label="Total ultimate" value={result ? fmt(result.analysis.summary.totalUltimate) : "-"} />
              <MetricTile label="Total IBNR" value={result ? fmt(result.analysis.summary.totalIbnr) : "-"} />
              <MetricTile label="IBNR / Paid" value={result ? String(result.analysis.summary.ibnrToPaidRatio) : "-"} />
              <MetricTile label="Completeness" value={result ? `${result.analysis.summary.completenessPct}%` : "-"} />
              <MetricTile label="Confidence" value={result ? result.analysis.summary.confidence : "-"} />
            </div>
          </Card>
          <Card eyebrow="Warnings" title="Reserving alerts">
            {result?.analysis.summary.warnings.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.summary.warnings.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No reserving alerts detected in this run.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="LDF" title="Loss development factors">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="py-2">From</th>
                  <th className="py-2">To</th>
                  <th className="py-2">Selected</th>
                  <th className="py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {(result?.analysis.ldfs ?? []).map((row) => (
                  <tr className="border-b border-slate-100" key={`${row.fromPeriod}-${row.toPeriod}`}>
                    <td className="py-2">{row.fromPeriod}</td>
                    <td className="py-2">{row.toPeriod}</td>
                    <td className="py-2">{row.selectedFactor}</td>
                    <td className="py-2">{row.dataPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card eyebrow="IBNR" title="Accident year projection table">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="py-2">AY</th>
                  <th className="py-2">Latest paid</th>
                  <th className="py-2">Ultimate</th>
                  <th className="py-2">IBNR</th>
                  <th className="py-2">% developed</th>
                </tr>
              </thead>
              <tbody>
                {(result?.analysis.results ?? []).map((row) => (
                  <tr className="border-b border-slate-100" key={row.accidentYear}>
                    <td className="py-2">{row.accidentYear}</td>
                    <td className="py-2">{fmt(row.latestDiagonal)}</td>
                    <td className="py-2">{fmt(row.ultimateEstimate)}</td>
                    <td className="py-2">{fmt(row.ibnr)}</td>
                    <td className="py-2">{row.pctDeveloped}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Methodology" title="Computation narrative">
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {(result?.analysis.methodology ?? []).map((line, index) => (
                <li key={`${line}-${index}`}>- {line}</li>
              ))}
            </ul>
          </Card>
          <Card eyebrow="Audit" title="Calculation audit trail">
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {(result?.analysis.auditNotes ?? []).map((line, index) => (
                <li key={`${line}-${index}`}>- {line}</li>
              ))}
            </ul>
          </Card>
        </div>

        <Card eyebrow="Whitespace" title="Whitespace wording table">
          <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-4 py-3">Field wording</th>
                  <th className="px-4 py-3">Extracted value</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(result?.analysis.whitespaceRows ?? []).map((row, index) => (
                  <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"} key={`${row.fieldWording}-${index}`}>
                    <td className="border-t border-slate-200 px-4 py-3 font-semibold text-slate-700">{row.fieldWording}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{row.extractedValue || "-"}</td>
                    <td className="border-t border-slate-200 px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${row.status === "EXTRACTED" ? "bg-emerald-100 text-emerald-700" : row.status === "INFERRED" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {row.status}
                      </span>
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

function MetaCard({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--panel-border)] bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-[1.75rem] leading-none text-slate-900">
        {dotClass ? <span className={`h-3 w-3 rounded-full ${dotClass}`} /> : null}
        <span className="text-base font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[16px] border border-[var(--panel-border)] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">{value}</p>
    </article>
  );
}

"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { AiReadinessLogo } from "@/components/ai-readiness-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { AiReadinessInsight } from "@/types/ai-readiness";

interface AnalyzeResponse {
  analysis: AiReadinessInsight;
  persistence: { status: string; reason?: string };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Insurance AI Readiness Scorer";
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

function readinessAppearance(state: AiReadinessInsight["summary"]["status"] | null) {
  if (state === "ready") return { dotClass: "bg-emerald-600", label: "Ready" };
  if (state === "needs-review") return { dotClass: "bg-amber-500", label: "Needs review" };
  if (state === "blocked") return { dotClass: "bg-red-600", label: "Blocked" };
  return { dotClass: "bg-slate-400", label: "Not run yet" };
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [assessmentText, setAssessmentText] = useState(demoSamples[0].assessmentText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");
  const readiness = readinessAppearance(result?.analysis.summary.status ?? null);

  async function runAnalysis() {
    const startedAt = globalThis.performance.now();
    const response = await fetch("/api/aireadiness/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "AI readiness analysis failed.");
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
    reader.onload = () => setAssessmentText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setAssessmentText(sample.assessmentText);
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
                  <AiReadinessLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 29 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">{appProjectName} | {appName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Score AI operating maturity across governance, data, tooling, and skills, then generate a deterministic
                  90-day plan for controlled scale-up.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current file" value={sourceLabel} />
              <MetaCard label="Readiness status" value={readiness.label} dotClass={readiness.dotClass} />
              <MetaCard label="Storage" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic maturity scoring and action planning" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="AI readiness assessment">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Assessment source input</p>
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Use key-value lines to define sponsor, governance, data foundation, blockers, and 90-day actions.</p>
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
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${
                        active ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(15,118,110,0.12)]" : "border-[var(--panel-border)] bg-white/70 hover:border-[var(--accent)]/45"
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
              <p className="text-sm font-semibold text-slate-700">Assessment text input</p>
              <div className="rounded-[20px] border border-slate-200 bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Statement text</p>
                <textarea className="mt-2 h-[310px] w-full resize-none rounded-[16px] border-0 bg-transparent px-1 py-1 text-sm leading-7 text-slate-800 outline-none shadow-none" id="assessmentText" onChange={(event) => setAssessmentText(event.target.value)} value={assessmentText} />
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="questionInput">Query prompt</label>
                <input className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none" id="questionInput" onChange={(event) => setQuestion(event.target.value)} value={question} />
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button className="w-full rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white disabled:opacity-60" disabled={isPending} onClick={submit} type="button">{isPending ? "Running..." : "Score AI readiness"}</button>
                  <p className="text-center text-sm text-slate-500">Runs deterministic maturity scoring and roadmap generation through the app route.</p>
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
          <Card eyebrow="Summary" title="Readiness overview">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Readiness score" value={result ? String(result.analysis.summary.readinessScore) : "-"} />
              <MetricTile label="Band" value={result ? result.analysis.summary.readinessBand : "-"} />
              <MetricTile label="Completeness" value={result ? `${result.analysis.summary.completenessPct}%` : "-"} />
              <MetricTile label="Confidence" value={result ? result.analysis.summary.confidence : "-"} />
            </div>
          </Card>
          <Card eyebrow="Query" title="Prompt match snippets">
            {result?.analysis.promptHits.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.promptHits.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
            )}
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
                {(result?.analysis.fields ?? []).map((row, index) => (
                  <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"} key={row.field}>
                    <td className="border-t border-slate-200 px-4 py-3 font-semibold text-slate-700">{row.field}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{row.value}</td>
                    <td className="border-t border-slate-200 px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${row.status === "extracted" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result ? <p className="px-4 py-3 text-sm text-slate-500">Run an analysis to view extracted whitespace fields.</p> : null}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Strengths" title="Current enablers">
            {result?.analysis.strengths.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.strengths.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No strengths extracted yet.</p>
            )}
          </Card>
          <Card eyebrow="Blockers" title="Delivery blockers">
            {result?.analysis.blockers.length ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.blockers.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No blockers extracted yet.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Plan" title="Ninety-day implementation plan">
          {result?.analysis.ninetyDayPlan.length ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {result.analysis.ninetyDayPlan.map((line, index) => (
                <li key={`${line}-${index}`}>- {line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Run an analysis to generate the 90-day plan.</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetaCard({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {dotClass ? <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} /> : null}
        {value}
      </p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

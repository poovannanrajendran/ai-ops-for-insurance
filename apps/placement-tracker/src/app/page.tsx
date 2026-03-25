"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

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

        <div className="grid gap-5 lg:grid-cols-2">
          <Card eyebrow="Summary" title="Placement overview">
            {result ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p>Placed share: {result.analysis.summary.placedSharePct}%</p>
                <p>Open share: {result.analysis.summary.openSharePct}%</p>
                <p>Projected share: {result.analysis.summary.projectedSharePct}%</p>
                <p>Critical flags: {result.analysis.priorityFlags.filter((flag) => flag.severity === "critical").length}</p>
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


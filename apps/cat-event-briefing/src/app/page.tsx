"use client";

import { AppGroupLogo, Card, CatEventBriefingLogo } from "@ai-ops/common-ui";
import { WorldEventHeatmap } from "@/components/world-event-heatmap";
import { demoSamples } from "@/lib/demo-samples";
import type { CatEventInsight } from "@/types/cat-event-briefing";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: CatEventInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Cat Event Briefing";

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
  const [eventText, setEventText] = useState<string>(demoSamples[0].eventText);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/cateventbriefing/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Cat event briefing failed.");
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
    setEventText(sample.eventText);
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
      const text = typeof reader.result === "string" ? reader.result : "";
      setEventText(text);
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
                  <CatEventBriefingLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 7 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Enter a catastrophe bulletin to generate a deterministic underwriting and claims briefing with affected classes,
                  initial loss band, warning triggers, and first-day actions.
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
              <MetaCard label="Mode" value="Cat event briefing and referral support" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Cat event source and bulletin">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Event source</label>
                  <div className="flex min-h-[280px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use built-in market scenarios, paste event bulletin text, or load a local `.txt` / `.pdf` extract.
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
                          accept=".txt,text/plain,.pdf"
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
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="event-text">
                    Cat event bulletin
                  </label>
                  <textarea
                    className="min-h-[280px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-8 text-slate-700 outline-none transition focus:border-[var(--accent)]"
                    id="event-text"
                    onChange={(event) => setEventText(event.target.value)}
                    value={eventText}
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
                    {isPending ? "Analyzing..." : "Generate briefing"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic Day 7 cat-event checks through the app route.</p>
                </div>

                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Event overview">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Peril: {result.analysis.summary.peril}</li>
                <li>Severity: {result.analysis.summary.severityLabel} ({result.analysis.summary.severityScore}/5)</li>
                <li>Estimated loss band: {result.analysis.summary.estimatedLossBand}</li>
                <li>Detected regions: {result.analysis.summary.regionCount}</li>
                <li>Affected classes: {result.analysis.summary.affectedClassesCount}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view event metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Referral triggers">
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
                <p className="text-sm text-emerald-700">No warning triggers for this event bulletin.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings will appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Briefing" title="Executive event briefing">
          {result ? (
            <div className="space-y-4 text-sm leading-6 text-slate-700">
              <p className="text-base font-semibold text-slate-900">{result.analysis.briefing.eventHeadline}</p>
              <Section title="Facts" items={result.analysis.briefing.facts} />
              <Section title="Impact" items={result.analysis.briefing.impacts} />
              <Section title="Suggested actions" items={result.analysis.briefing.suggestedActions} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Briefing narrative will render after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Classes" title="Affected classes of business">
            {result ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Class</th>
                      <th className="px-2 py-2">Priority</th>
                      <th className="px-2 py-2">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.analysis.affectedClasses.map((item) => (
                      <tr className="border-b border-slate-100" key={item.className}>
                        <td className="px-2 py-2 font-semibold">{item.className}</td>
                        <td className="px-2 py-2 capitalize">{item.priority}</td>
                        <td className="px-2 py-2">{item.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Class impact ranking appears after analysis.</p>
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

        <Card eyebrow="Heatmap" title="World event heatmap">
          {result ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Circles represent detected regions. Auto-zoom is capped at 1.5x for context.</p>
              <WorldEventHeatmap points={result.analysis.heatPoints} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Heatmap appears after analysis.</p>
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

function Section({ items, title }: { items: string[]; title: string }) {
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

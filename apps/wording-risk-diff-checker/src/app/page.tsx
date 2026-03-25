"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { WordingRiskDiffLogo } from "@/components/wording-risk-diff-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { ClauseDiff, Severity, WordingRiskDiffInsight } from "@/types/wording-risk-diff";

interface AnalyzeResponse {
  analysis: WordingRiskDiffInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Wording Risk Diff Checker";

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

function statusAppearance(status: string): { dotClass: string; label: string } {
  if (status === "stored") {
    return { dotClass: "bg-emerald-600", label: "Supabase synced" };
  }

  if (status === "failed") {
    return { dotClass: "bg-red-600", label: "Needs attention" };
  }

  return { dotClass: "bg-amber-500", label: "Pending credentials" };
}

function severityClasses(severity: Severity): string {
  if (severity === "high") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function Page() {
  const baselineFileRef = useRef<HTMLInputElement | null>(null);
  const revisedFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [baselineText, setBaselineText] = useState(demoSamples[0].baselineText);
  const [revisedText, setRevisedText] = useState(demoSamples[0].revisedText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/wordingriskdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        baselineText,
        revisedText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Wording diff analysis failed.");
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
    setBaselineText(sample.baselineText);
    setRevisedText(sample.revisedText);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>, type: "baseline" | "revised") {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (type === "baseline") {
        setBaselineText(text);
      } else {
        setRevisedText(text);
      }
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  const storage = result ? statusAppearance(result.persistence.status) : { dotClass: "bg-slate-400", label: "Awaiting run" };

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
                  <WordingRiskDiffLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 19 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Compare baseline and revised insurance wording, isolate risk-impact deltas deterministically, and surface clause-level severity tags for fast escalation decisions.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic wording diff and risk triage" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Baseline vs revised wording">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <WordingPane
                title="Baseline wording"
                helper="Load the prior approved wording or paste an extract for comparison."
                text={baselineText}
                setText={setBaselineText}
                fileRef={baselineFileRef}
                onFileChange={(event) => handleFileSelection(event, "baseline")}
                textareaId="baseline-text"
              />
              <WordingPane
                title="Revised wording"
                helper="Paste revised or renewal wording to compare against the baseline."
                text={revisedText}
                setText={setRevisedText}
                fileRef={revisedFileRef}
                onFileChange={(event) => handleFileSelection(event, "revised")}
                textareaId="revised-text"
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

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="sourceLabel">
                  Source label
                </label>
                <input
                  className="w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                  id="sourceLabel"
                  onChange={(event) => setSourceLabel(event.target.value)}
                  value={sourceLabel}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="questionInput">
                  Query prompt
                </label>
                <input
                  className="w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                  id="questionInput"
                  onChange={(event) => setQuestion(event.target.value)}
                  value={question}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                className="rounded-full bg-[var(--accent)] px-12 py-3 text-base font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                onClick={submit}
                type="button"
              >
                {isPending ? "Analyzing..." : "Analyze wording delta"}
              </button>
              <p className="text-center text-sm text-slate-500">
                Runs deterministic clause parsing, risk-impact tagging, and route-level persistence semantics.
              </p>
            </div>

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Summary" title="Risk delta overview">
            {result ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryStat label="Material changes" value={String(result.analysis.summary.materialChangeCount)} tone="high" />
                <SummaryStat label="High severity" value={String(result.analysis.summary.highSeverityCount)} tone="high" />
                <SummaryStat label="Added clauses" value={String(result.analysis.summary.addedCount)} tone="medium" />
                <SummaryStat label="Removed clauses" value={String(result.analysis.summary.removedCount)} tone="medium" />
                <SummaryStat label="Changed clauses" value={String(result.analysis.summary.changedCount)} tone="neutral" />
                <SummaryStat label="Stable clauses" value={String(result.analysis.summary.stableCount)} tone="neutral" />
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-600">Run the analysis to see clause counts and severity totals.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Escalation flags">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.warnings.map((warning) => (
                    <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3" key={warning.code}>
                      <p className="text-sm font-semibold text-slate-900">{warning.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">No escalation warnings were triggered for the current comparison.</p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-600">Warnings appear here when restrictive or clustered material shifts are detected.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Briefing" title="Executive readout">
          {result ? (
            <div className="space-y-5">
              <p className="text-lg font-semibold text-slate-950">{result.analysis.executiveBrief.headline}</p>
              <p className="text-sm leading-7 text-slate-700">{result.analysis.executiveBrief.narrative}</p>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.executiveBrief.actions.map((action) => (
                  <li key={action}>- {action}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-600">Run analysis to produce a structured wording change brief.</p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card eyebrow="Ledger" title="Clause change ledger">
            {result ? (
              result.analysis.clauseDiffs.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.clauseDiffs.map((diff) => (
                    <ClauseCard diff={diff} key={`${diff.clauseKey}-${diff.changeType}`} />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">No clause-level diffs were detected.</p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-600">Each detected clause delta is listed here with severity, rationale, and before/after wording.</p>
            )}
          </Card>

          <div className="grid gap-6">
            <Card eyebrow="Query" title="Prompt match snippets">
              {result ? (
                result.analysis.queryHits.length > 0 ? (
                  <ul className="space-y-3 text-sm leading-6 text-slate-700">
                    {result.analysis.queryHits.map((hit) => (
                      <li key={hit}>- {hit}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">No direct matches for the current prompt.</p>
                )
              ) : (
                <p className="text-sm leading-6 text-slate-600">Prompt-matched ledger lines will appear here.</p>
              )}
            </Card>

            <Card eyebrow="Persistence" title="Storage status">
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-3 w-3 rounded-full ${storage.dotClass}`} />
                <p className="text-sm leading-6 text-slate-600">
                  {result
                    ? result.persistence.status === "stored"
                      ? "Result stored in Supabase."
                      : `Storage ${result.persistence.status}. ${result.persistence.reason ?? ""}`.trim()
                    : "Supabase storage is optional. If server credentials are present, analysis and audit stages are written to the Day 19 schema."}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function WordingPane({
  title,
  helper,
  text,
  setText,
  fileRef,
  onFileChange,
  textareaId
}: {
  title: string;
  helper: string;
  text: string;
  setText: (value: string) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  textareaId: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{title}</label>
      <div className="flex min-h-[330px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            Select File
          </button>
          <input accept=".txt,text/plain" className="hidden" onChange={onFileChange} ref={fileRef} type="file" />
        </div>

        <div className="mt-5 flex-1 space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor={textareaId}>
            {title}
          </label>
          <textarea
            className="min-h-[210px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-8 text-slate-700 outline-none transition focus:border-[var(--accent)]"
            id={textareaId}
            onChange={(event) => setText(event.target.value)}
            value={text}
          />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/78 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {dotClass ? <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} /> : null}
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: "high" | "medium" | "neutral" }) {
  const toneClasses =
    tone === "high"
      ? "border-red-200 bg-red-50"
      : tone === "medium"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-slate-100";

  return (
    <div className={`rounded-[18px] border px-4 py-4 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ClauseCard({ diff }: { diff: ClauseDiff }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{diff.section}</p>
          <p className="mt-1 text-base font-semibold text-slate-950">{diff.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClasses(diff.severity)}`}>
            {diff.severity} severity
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {diff.changeType}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{diff.rationale}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {diff.tags.map((tag) => (
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]" key={tag}>
            {tag.replaceAll("_", " ")}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ComparisonCell title="Baseline" value={diff.baselineValue} />
        <ComparisonCell title="Revised" value={diff.revisedValue} />
      </div>
    </div>
  );
}

function ComparisonCell({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value ?? "Not present"}</p>
    </div>
  );
}

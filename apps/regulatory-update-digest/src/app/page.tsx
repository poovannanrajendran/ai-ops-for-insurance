"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { RegulatoryUpdateDigestLogo } from "@/components/regulatory-update-digest-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { RegulatoryDigestInsight, Severity } from "@/types/regulatory-digest";

interface AnalyzeResponse {
  analysis: RegulatoryDigestInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Regulatory Update Digest";
const appProjectName = "30 Useful Insurance and Productivity Apps";

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

  return { dotClass: "bg-amber-500", label: "Awaiting run" };
}

function severityClasses(severity: Severity): string {
  if (severity === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function priorityDotClass(alert: string): string {
  const line = alert.toLowerCase();
  if (line.includes("high")) return "bg-red-600";
  if (line.includes("medium")) return "bg-amber-500";
  return "bg-emerald-600";
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [feedText, setFeedText] = useState(demoSamples[0].feedText);
  const [classFocus, setClassFocus] = useState(demoSamples[0].classFocus);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/regulatorydigest/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        feedText,
        classFocus,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Regulatory digest analysis failed.");
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

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFeedText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      setError("Unable to read selected file.");
    };
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) {
      return;
    }

    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setFeedText(sample.feedText);
    setClassFocus(sample.classFocus);
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
                  <RegulatoryUpdateDigestLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 20 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Summarise regulatory updates across Lloyd&apos;s, PRA, FCA, and sanctions channels, rank relevance by class
                  focus, and output governance-ready actions.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Feed text state" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic feed parsing and relevance ranking" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Regulatory feed source and content">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Paste structured regulatory feed text or upload a local <code>.txt</code> extract.
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
                <label className="block text-sm font-semibold text-slate-700" htmlFor="feedText">
                  Regulatory feed text
                </label>
                <textarea
                  className="mt-2 h-[290px] w-full resize-none rounded-[16px] border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none"
                  id="feedText"
                  onChange={(event) => setFeedText(event.target.value)}
                  value={feedText}
                />
                <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="classFocus">
                  Class focus
                </label>
                <input
                  className="mt-2 w-full rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none"
                  id="classFocus"
                  onChange={(event) => setClassFocus(event.target.value)}
                  value={classFocus}
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
                    {isPending ? "Running..." : "Build digest"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Runs deterministic parsing, relevance scoring, and governance action extraction.
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
          <Card eyebrow="Summary" title="Digest overview">
            {result ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Bulletins parsed" value={String(result.analysis.summary.bulletinCount)} />
                <MetricTile label="Relevant updates" value={String(result.analysis.summary.relevantCount)} />
                <MetricTile label="High severity" value={String(result.analysis.summary.highSeverityCount)} />
                <MetricTile label="Sources covered" value={result.analysis.summary.sourceCoverage.join(", ")} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run the digest to view summary metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Priority alerts">
            {result ? (
              result.analysis.priorityAlerts.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.priorityAlerts.map((alert, index) => (
                    <li className="flex items-start gap-2" key={`${alert}-${index}`}>
                      <span className={`mt-2 inline-block h-2.5 w-2.5 rounded-full ${priorityDotClass(alert)}`} />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No high-priority alerts in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Priority alerts appear after digesting.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Actions" title="Governance action board">
          {result ? (
            result.analysis.actions.length > 0 ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.actions.map((action, index) => (
                  <li key={`${action}-${index}`}>- {action}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No action items extracted.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">Action board appears after digesting.</p>
          )}
        </Card>

        <Card eyebrow="Ledger" title="Update relevance ledger">
          {result ? (
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white/80">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Update</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.updates.map((update) => (
                    <tr className="border-t border-slate-200" key={update.id}>
                      <td className="px-4 py-3">{update.title}</td>
                      <td className="px-4 py-3">{update.source}</td>
                      <td className="px-4 py-3">{update.publishedOn}</td>
                      <td className="px-4 py-3">{update.relevanceScore}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${severityClasses(update.severity)}`}>
                          {update.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Ledger appears after digesting.</p>
          )}
        </Card>

        <Card eyebrow="Whitespace" title="Whitespace wording table">
          {result ? (
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white/80">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Field wording</th>
                    <th className="px-4 py-3">Extracted value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.whitespaceRows.map((row, index) => (
                    <tr className={index % 2 === 0 ? "border-t border-slate-200 bg-white/70" : "border-t border-slate-200 bg-slate-50/70"} key={`${row.fieldWording}-${index}`}>
                      <td className="px-4 py-3 font-semibold">{row.fieldWording}</td>
                      <td className="px-4 py-3">{row.extractedValue || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${
                            row.status === "EXTRACTED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
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
            <p className="text-sm text-slate-500">Whitespace table appears after digesting.</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

function MetaCard({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {dotClass ? <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} /> : null}
        {value}
      </p>
    </div>
  );
}

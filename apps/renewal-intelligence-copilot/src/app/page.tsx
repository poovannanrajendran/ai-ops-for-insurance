"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { RenewalIntelligenceCopilotLogo } from "@/components/renewal-intelligence-copilot-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { RenewalCopilotInsight, Severity } from "@/types/renewal-copilot";

interface AnalyzeResponse {
  analysis: RenewalCopilotInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appName = "Renewal Intelligence Copilot";
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

function severityClasses(severity: Severity): string {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [renewalText, setRenewalText] = useState(demoSamples[0].renewalText);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  const storage = result ? statusAppearance(result.persistence.status) : statusAppearance("pending");
  const directionDot =
    result?.analysis.summary.pricingDirection === "increase"
      ? "bg-red-600"
      : result?.analysis.summary.pricingDirection === "decrease"
        ? "bg-emerald-600"
        : "bg-amber-500";
  const directionValue = result
    ? `${result.analysis.summary.pricingDirection} (${result.analysis.summary.recommendedMovementPct >= 0 ? "+" : ""}${result.analysis.summary.recommendedMovementPct}%)`
    : "Not run yet";

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/renewalcopilot/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ renewalText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Renewal copilot analysis failed.");
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
    reader.onload = () => setRenewalText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setRenewalText(sample.renewalText);
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
                  <RenewalIntelligenceCopilotLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 22 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Parse renewal pack data, score pricing drivers, and generate a clear strategy memo with negotiation
                  talking points and governance actions.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Active file" value={sourceLabel} />
              <MetaCard label="Pricing direction" value={directionValue} dotClass={directionDot} />
              <MetaCard label="Storage state" value={storage.label} dotClass={storage.dotClass} />
              <MetaCard label="Mode" value="Deterministic renewal strategy and pricing cues" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Renewal pack details">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-dashed border-[var(--accent)]/30 bg-white/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Input pack</p>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Upload zone</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Upload or paste renewal pack fields using deterministic key labels such as <code>LOSS RATIO PCT</code>,{" "}
                  <code>EXPOSURE CHANGE PCT</code>, and <code>BROKER OBJECTIVE</code>.
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
                <label className="block text-sm font-semibold text-slate-700" htmlFor="renewalText">
                  Renewal statement
                </label>
                <textarea
                  className="mt-2 h-[310px] w-full resize-none rounded-[16px] border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none"
                  id="renewalText"
                  onChange={(event) => setRenewalText(event.target.value)}
                  value={renewalText}
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
                    {isPending ? "Running..." : "Build renewal strategy"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Runs deterministic pricing signal extraction and renewal memo generation.
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
          <Card eyebrow="Summary" title="Renewal overview">
            {result ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Direction" value={result.analysis.summary.pricingDirection} />
                <MetricTile label="Movement (%)" value={String(result.analysis.summary.recommendedMovementPct)} />
                <MetricTile label="High risk drivers" value={String(result.analysis.summary.highRiskDrivers)} />
                <MetricTile label="Open actions" value={String(result.analysis.summary.openActions)} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run analysis to view summary metrics.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((hit, index) => (
                    <li key={`${hit}-${index}`}>- {hit}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Matched snippets appear after analysis.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Memo" title="Strategy memo">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.strategyMemo.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Strategy memo appears after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Negotiation" title="Talking points">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.negotiationTalkingPoints.map((line, index) => (
                  <li key={`${line}-${index}`}>- {line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Talking points appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Signals" title="Pricing signal drivers">
          {result ? (
            <div className="grid gap-3 md:grid-cols-2">
              {result.analysis.pricingSignals.map((signal, index) => (
                <div className="rounded-[16px] border border-slate-200 bg-white/75 p-4" key={`${signal.driver}-${index}`}>
                  <p className="text-sm font-semibold text-slate-900">{signal.driver}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Direction: {signal.direction} ({signal.impactPct >= 0 ? "+" : ""}
                    {signal.impactPct}%)
                  </p>
                  <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${severityClasses(signal.severity)}`}>
                    {signal.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Signal board appears after analysis.</p>
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
                    <tr
                      className={
                        index % 2 === 0
                          ? "border-t border-slate-200 bg-white/70"
                          : "border-t border-slate-200 bg-slate-50/70"
                      }
                      key={`${row.fieldWording}-${index}`}
                    >
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
            <p className="text-sm text-slate-500">Whitespace table appears after analysis.</p>
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

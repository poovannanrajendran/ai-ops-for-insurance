"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { PolicyEndorsementDiffLogo } from "@/components/policy-endorsement-diff-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { ClauseDiff, PolicyEndorsementDiffInsight } from "@/types/policy-endorsement-diff";

interface AnalyzeResponse {
  analysis: PolicyEndorsementDiffInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Policy Endorsement Diff Checker";

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

function severityTone(severity: ClauseDiff["severity"]): string {
  if (severity === "high") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }

  if (severity === "medium") {
    return "border-slate-300 bg-slate-100 text-slate-800";
  }

  return "border-stone-300 bg-stone-100 text-stone-700";
}

export default function Page() {
  const expiringFileRef = useRef<HTMLInputElement | null>(null);
  const renewalFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [expiringText, setExpiringText] = useState<string>(demoSamples[0].expiringText);
  const [renewalText, setRenewalText] = useState<string>(demoSamples[0].renewalText);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/policyendorsementdiff/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expiringText,
        renewalText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Endorsement diff analysis failed.");
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
    setExpiringText(sample.expiringText);
    setRenewalText(sample.renewalText);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    type: "expiring" | "renewal"
  ) {
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
      if (type === "expiring") {
        setExpiringText(text);
      } else {
        setRenewalText(text);
      }
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(63,46,20,0.14)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(63,46,20,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <PolicyEndorsementDiffLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 8 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Compare expiring and renewal endorsement wording, isolate material shifts, and surface clause-level escalation items for fast reviewer sign-off.
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
              <MetaCard label="Mode" value="Policy endorsement comparison and change triage" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Expiring vs renewal wording">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Expiring wording</label>
                  <div className="flex min-h-[320px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Load expiring wording from a local `.txt` extract or use a prepared synthetic sample.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                          onClick={() => expiringFileRef.current?.click()}
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
                          onChange={(event) => handleFileSelection(event, "expiring")}
                          ref={expiringFileRef}
                          type="file"
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex-1 space-y-2">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="expiring-text">
                        Expiring clauses
                      </label>
                      <textarea
                        className="min-h-[200px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-8 text-slate-700 outline-none transition focus:border-[var(--accent)]"
                        id="expiring-text"
                        onChange={(event) => setExpiringText(event.target.value)}
                        value={expiringText}
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
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(245,158,11,0.14)]"
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
                  <label className="block text-sm font-semibold text-slate-700">Renewal wording</label>
                  <div className="flex min-h-[320px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Load renewal wording from a local `.txt` extract or continue using the paired sample wording.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                          onClick={() => renewalFileRef.current?.click()}
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
                          onChange={(event) => handleFileSelection(event, "renewal")}
                          ref={renewalFileRef}
                          type="file"
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex-1 space-y-2">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="renewal-text">
                        Renewal clauses
                      </label>
                      <textarea
                        className="min-h-[200px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-8 text-slate-700 outline-none transition focus:border-[var(--accent)]"
                        id="renewal-text"
                        onChange={(event) => setRenewalText(event.target.value)}
                        value={renewalText}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
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
                    className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(110,77,18,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Comparing..." : "Analyze endorsements"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic clause comparison and material-change analysis through the app route.</p>
                </div>

                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Change overview">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Material changes: {result.analysis.summary.materialChangeCount}</li>
                <li>High severity: {result.analysis.summary.highSeverityCount}</li>
                <li>Medium severity: {result.analysis.summary.mediumSeverityCount}</li>
                <li>Added clauses: {result.analysis.summary.addedCount}</li>
                <li>Removed clauses: {result.analysis.summary.removedCount}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view endorsement change totals.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Escalation flags">
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
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">No escalation flags were raised for this wording pair.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Escalation flags will appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Briefing" title="Executive endorsement brief">
          {result ? (
            <div className="space-y-4 text-sm leading-6 text-slate-700">
              <p className="text-base font-semibold text-slate-900">{result.analysis.executiveBrief.headline}</p>
              <Section title="Key findings" items={result.analysis.executiveBrief.findings} />
              <Section title="Action points" items={result.analysis.executiveBrief.actionPoints} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Query response</p>
                <p className="mt-2">{result.analysis.executiveBrief.queryResponse}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Briefing commentary will render after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Ledger" title="Clause change ledger">
            {result ? (
              <div className="space-y-3">
                {result.analysis.clauseDiffs.map((item) => (
                  <div className={`rounded-2xl border px-4 py-3 ${severityTone(item.severity)}`} key={`${item.section}-${item.label}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em]">{item.section}</p>
                        <p className="mt-1 text-base font-semibold">{item.label}</p>
                      </div>
                      <div className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                        {item.changeType} | {item.severity}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6">{item.rationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Clause-level diffs appear after analysis.</p>
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
              <p className="text-sm text-slate-500">Query matches will appear here after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Comparison" title="Expiring vs renewal clause table">
          {result ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Clause</th>
                    <th className="px-2 py-2">Expiring</th>
                    <th className="px-2 py-2">Renewal</th>
                    <th className="px-2 py-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.clauseDiffs.map((item) => (
                    <tr className="border-b border-slate-100 align-top" key={`table-${item.section}-${item.label}`}>
                      <td className="px-2 py-3 font-semibold">
                        <div>{item.label}</div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{item.section}</div>
                      </td>
                      <td className="px-2 py-3">{item.expiringValue ?? "Not present"}</td>
                      <td className="px-2 py-3">{item.renewalValue ?? "Not present"}</td>
                      <td className="px-2 py-3 capitalize">{item.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">The comparison table will render after analysis.</p>
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

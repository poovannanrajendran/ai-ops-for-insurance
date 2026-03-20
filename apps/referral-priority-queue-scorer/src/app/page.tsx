"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { ReferralPriorityQueueLogo } from "@/components/referral-priority-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { QueueInsight, QueueWarning, RankedReferral } from "@/types/referral-queue";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: QueueInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Referral Priority Queue Scorer";

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
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [queueText, setQueueText] = useState<string>(demoSamples[0].queueText);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/referralqueue/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        queueText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Referral queue scoring failed.");
      return;
    }

    setAnalysisTimeMs(typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(performance.now() - startedAt));
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
    setQueueText(sample.queueText);
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
      setQueueText(text);
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  const topReferral = result?.analysis.rankedReferrals[0] ?? null;

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
                  <ReferralPriorityQueueLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 9 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Score a referral queue deterministically, rank review order, and surface the exact factors driving critical,
                  high, moderate, and routine treatment.
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
              <MetaCard label="Mode" value="Queue scoring and escalation ordering" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Referral queue source and dataset">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Queue source</label>
                  <div className="flex min-h-[310px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use built-in TSV queues, paste referral rows, or load a local `.tsv` / `.txt` extract.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => fileInputRef.current?.click()} type="button">
                          Select File
                        </button>
                        <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => loadSample(demoSamples[0].id)} type="button">
                          Reset sample
                        </button>
                        <input accept=".tsv,.txt,text/plain" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
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
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="queue-text">
                    Queue dataset (TSV)
                  </label>
                  <textarea
                    className="min-h-[310px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 font-mono text-sm leading-7 text-slate-700 outline-none transition focus:border-[var(--accent)]"
                    id="queue-text"
                    onChange={(event) => setQueueText(event.target.value)}
                    value={queueText}
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
                    {isPending ? "Scoring..." : "Score queue"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic Day 9 queue scoring and persistence checks through the app route.</p>
                </div>

                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Queue overview">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Queue count: {result.analysis.summary.queueCount}</li>
                <li>Highest score: {result.analysis.summary.highestScore}</li>
                <li>Average score: {result.analysis.summary.averageScore}</li>
                <li>Critical referrals: {result.analysis.summary.criticalCount}</li>
                <li>High referrals: {result.analysis.summary.highCount}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run a score to view queue metrics.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Escalation triggers">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.warnings.map((warning) => (
                    <WarningItem key={warning.code} warning={warning} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-700">No queue-level warning triggers. Fast-track candidates are available.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Escalation warnings will render after scoring.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Card eyebrow="Queue" title="Ranked referral order">
            {result ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Rank</th>
                      <th className="px-2 py-2">Referral</th>
                      <th className="px-2 py-2">Class</th>
                      <th className="px-2 py-2">Score</th>
                      <th className="px-2 py-2">Urgency</th>
                      <th className="px-2 py-2">Complexity</th>
                      <th className="px-2 py-2">Top factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.analysis.rankedReferrals.map((item, index) => (
                      <tr className="border-b border-slate-100 align-top" key={item.referral.referralId}>
                        <td className="px-2 py-3 font-semibold">{index + 1}</td>
                        <td className="px-2 py-3">
                          <p className="font-semibold text-slate-900">{item.referral.insuredName}</p>
                          <p className="text-xs text-slate-500">{item.referral.referralId} | {item.referral.territory}</p>
                        </td>
                        <td className="px-2 py-3">{item.referral.classOfBusiness}</td>
                        <td className="px-2 py-3 font-semibold">{item.score}</td>
                        <td className="px-2 py-3"><UrgencyBadge band={item.urgencyBand} /></td>
                        <td className="px-2 py-3 capitalize">{item.complexityBand}</td>
                        <td className="px-2 py-3">{item.factorBreakdown[0]?.detail ?? "No factors"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">The ranked queue will appear after scoring.</p>
            )}
          </Card>

          <Card eyebrow="Spotlight" title="Lead review item">
            {topReferral ? (
              <div className="space-y-4 text-sm leading-6 text-slate-700">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{topReferral.referral.insuredName}</p>
                  <p className="text-sm text-slate-500">{topReferral.referral.referralId} | {topReferral.referral.classOfBusiness} | {topReferral.referral.territory}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UrgencyBadge band={topReferral.urgencyBand} />
                  <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    {topReferral.complexityBand}
                  </span>
                </div>
                <p>{topReferral.recommendation}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Top factor breakdown</p>
                  <ul className="mt-2 space-y-2">
                    {topReferral.factorBreakdown.slice(0, 5).map((factor) => (
                      <li className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2" key={`${topReferral.referral.referralId}-${factor.code}`}>
                        <span className="font-semibold">+{factor.contribution}</span> {factor.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Lead review details will render after scoring.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Drivers" title="Queue-level score drivers">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {result.analysis.topDrivers.map((driver) => (
                  <li key={driver}>- {driver}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">The strongest score drivers will appear here after scoring.</p>
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
                <p className="text-sm text-slate-500">No queue rows matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Matched snippets appear here after scoring.</p>
            )}
          </Card>
        </div>
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

function UrgencyBadge({ band }: { band: RankedReferral["urgencyBand"] }) {
  const className =
    band === "critical"
      ? "border-amber-400 bg-amber-50 text-amber-800"
      : band === "high"
        ? "border-orange-300 bg-orange-50 text-orange-700"
        : band === "moderate"
          ? "border-slate-300 bg-slate-100 text-slate-700"
          : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>{band}</span>;
}

function WarningItem({ warning }: { warning: QueueWarning }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-700">
      <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
        !
      </span>
      <span>{warning.message}</span>
    </div>
  );
}

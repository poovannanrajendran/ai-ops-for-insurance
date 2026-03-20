"use client";

import { useRef, useState } from "react";

import { AppGroupLogo } from "@/components/app-group-logo";
import { FnolTriageLogo } from "@/components/fnol-triage-logo";
import { Card } from "@/components/ui/card";
import { demoSamples } from "@/lib/demo-samples";
import type { FnolTriageInsight, ParsedFnol } from "@/types/fnol-triage";

interface AnalyzeResponse {
  analysis: FnolTriageInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Claims FNOL Triage Assistant";

function formatDuration(ms: number | null): string {
  if (ms == null) return "00:00:00";
  const total = Math.max(0, Math.round(ms));
  const seconds = Math.floor(total / 1000);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((total % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${remainingSeconds}:${centiseconds}`;
}

const parsedFieldOrder: Array<[keyof ParsedFnol, string]> = [
  ["claimReference", "Claim reference"],
  ["insuredName", "Insured name"],
  ["classOfBusiness", "Class of business"],
  ["lossDate", "Loss date"],
  ["reportedDate", "Reported date"],
  ["location", "Location"],
  ["causeOfLoss", "Cause of loss"],
  ["estimatedReserveGbp", "Estimated reserve (GBP)"],
  ["injuryCount", "Injury count"],
  ["thirdPartyInjury", "Third-party injury"],
  ["fatalityIndicator", "Fatality indicator"],
  ["policeReport", "Police report"],
  ["fraudIndicator", "Fraud indicator"],
  ["claimantRepresented", "Claimant represented"],
  ["litigationIndicator", "Litigation indicator"],
  ["propertyDamageSeverity", "Damage severity"],
  ["businessInterruptionDays", "Business interruption days"],
  ["missingFieldCount", "Missing field count"]
];

const whitespaceFieldOrder: Array<[keyof ParsedFnol, string]> = [
  ["claimReference", "Claim Reference"],
  ["insuredName", "Insured Name"],
  ["classOfBusiness", "Class Of Business"],
  ["lossDate", "Loss Date"],
  ["reportedDate", "Reported Date"],
  ["location", "Location"],
  ["causeOfLoss", "Cause Of Loss"],
  ["estimatedReserveGbp", "Estimated Reserve (GBP)"],
  ["currency", "Currency"],
  ["injuryCount", "Injury Count"],
  ["thirdPartyInjury", "Third Party Injury"],
  ["fatalityIndicator", "Fatality Indicator"],
  ["policeReport", "Police Report"],
  ["fraudIndicator", "Fraud Indicator"],
  ["claimantRepresented", "Claimant Represented"],
  ["litigationIndicator", "Litigation Indicator"],
  ["propertyDamageSeverity", "Property Damage Severity"],
  ["businessInterruptionDays", "Business Interruption Days"]
];

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fnolText, setFnolText] = useState(demoSamples[0].fnolText);
  const [sourceLabel, setSourceLabel] = useState(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState(demoSamples[0].question);
  const [selectedSampleId, setSelectedSampleId] = useState(demoSamples[0].id);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/fnoltriage/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fnolText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "FNOL triage failed.");
      return;
    }

    setResult(data);
    setAnalysisTimeMs(typeof data.processingTimeMs === "number" ? data.processingTimeMs : Math.round(performance.now() - startedAt));
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
    if (!sample) return;
    setSelectedSampleId(sample.id);
    setFnolText(sample.fnolText);
    setSourceLabel(sample.sourceLabel);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setFnolText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsText(file);
  }

  const storageValue = result
    ? result.persistence.status === "stored"
      ? "Supabase synced"
      : result.persistence.status === "failed"
        ? "Needs attention"
        : "Pending credentials"
    : "Awaiting run";

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
                  <FnolTriageLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 10 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">{appProjectName} | {appName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Triage first notice of loss submissions deterministically, assign the right claims lane, and surface exactly why the case
                  should fast-track, go to standard review, or escalate.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={storageValue} />
              <MetaCard label="Mode" value="FNOL routing and escalation support" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="FNOL source and notice">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">FNOL source</label>
                  <div className="flex min-h-[320px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use prepared FNOL samples, paste a notice, or load a local `.txt` extract from a claims intake pack.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => fileInputRef.current?.click()} type="button">Select File</button>
                        <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => loadSample(demoSamples[0].id)} type="button">Reset sample</button>
                        <input accept=".txt,text/plain" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
                      </div>
                    </div>
                    <div className="mt-auto space-y-2">
                      <label className="block text-sm font-semibold text-slate-700" htmlFor="source-label">Source label</label>
                      <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]" id="source-label" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {demoSamples.map((sample) => {
                    const isActive = sample.id === selectedSampleId;
                    return (
                      <button
                        className={`rounded-[18px] border px-3 py-3 text-left transition ${isActive ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(245,158,11,0.18)]" : "border-slate-200 bg-white/60 hover:border-[var(--accent)]/45"}`}
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
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="fnol-text">FNOL notice</label>
                  <textarea className="min-h-[320px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-base leading-7 text-slate-700 outline-none transition focus:border-[var(--accent)]" id="fnol-text" onChange={(event) => setFnolText(event.target.value)} value={fnolText} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="question">Query prompt</label>
                  <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-[var(--accent)]" id="question" onChange={(event) => setQuestion(event.target.value)} value={question} />
                </div>
                <div className="space-y-3">
                  <button className="rounded-full bg-[var(--accent-strong)] px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65" disabled={isPending} onClick={submit} type="button">
                    {isPending ? "Triaging..." : "Triage FNOL"}
                  </button>
                  <p className="text-sm text-slate-500">Runs deterministic Day 10 claims triage checks through the app route.</p>
                  {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                  {result?.persistence.reason ? <p className="text-sm text-amber-700">{result.persistence.reason}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Summary" title="Triage overview">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Disposition: {result.analysis.summary.disposition}</li>
                <li>Triage score: {result.analysis.summary.triageScore}</li>
                <li>Reserve band: {result.analysis.summary.reserveBand}</li>
                <li>Injury count: {result.analysis.summary.injuryCount}</li>
                <li>Missing fields: {result.analysis.summary.missingFieldCount}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run triage to view the disposition and core metrics.</p>
            )}
          </Card>
          <Card eyebrow="Warnings" title="Claims governance flags">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.warnings.map((warning) => (
                    <li className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2" key={warning.code}>
                      <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">!</span>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">No governance warnings are triggered for this FNOL.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings will appear after triage.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Card eyebrow="Decision" title="Triage route and next actions">
            {result ? (
              <div className="space-y-4 text-sm leading-6 text-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-slate-950">{result.analysis.decision.headline}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${dispositionBadge(result.analysis.summary.disposition)}`}>
                    {result.analysis.summary.disposition}
                  </span>
                </div>
                <p>{result.analysis.decision.rationale}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next actions</p>
                  <ul className="mt-2 space-y-2">
                    {result.analysis.decision.nextActions.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Decisioning guidance will render after triage.</p>
            )}
          </Card>
          <Card eyebrow="Drivers" title="Top factor breakdown">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.analysis.factors.map((factor) => (
                  <li className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2" key={`${factor.code}-${factor.detail}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">{factor.code.replace(/_/g, " ")}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">+{factor.contribution}</span>
                    </div>
                    <p className="mt-1">{factor.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Factor scoring will appear after triage.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Parsed" title="Extracted FNOL fields">
            {result ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedFieldOrder.map(([key, label]) => (
                  <div className="rounded-2xl border border-slate-200 bg-white/60 px-3 py-3" key={String(key)}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{formatParsedValue(result.analysis.parsedFnol[key])}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Parsed FNOL fields will render after triage.</p>
            )}
          </Card>
          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((hit) => <li key={hit}>- {hit}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Query matches appear here after triage.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5">
          <Card eyebrow="Whitespace" title="Whitespace wording table">
            {result ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/60">
                <table className="w-full min-w-[720px] text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Field wording</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Extracted value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whitespaceFieldOrder.map(([key, wording]) => {
                      const status = extractionStatus(result.analysis.parsedFnol[key]);
                      return (
                        <tr className="border-t border-slate-200" key={String(key)}>
                          <td className="px-3 py-2 font-medium text-slate-800">{wording}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                                status === "Extracted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{formatParsedValue(result.analysis.parsedFnol[key])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Whitespace wording rows will render after triage.</p>
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

function formatParsedValue(value: ParsedFnol[keyof ParsedFnol]) {
  if (value == null || value === "") return "Not stated";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-GB");
  return value;
}

function extractionStatus(value: ParsedFnol[keyof ParsedFnol]): "Extracted" | "Missing" {
  if (value == null || value === "") return "Missing";
  return "Extracted";
}

function dispositionBadge(disposition: AnalyzeResponse["analysis"]["summary"]["disposition"]) {
  if (disposition === "escalate") return "bg-amber-100 text-amber-800";
  if (disposition === "manual-review") return "bg-slate-200 text-slate-800";
  return "bg-emerald-100 text-emerald-800";
}

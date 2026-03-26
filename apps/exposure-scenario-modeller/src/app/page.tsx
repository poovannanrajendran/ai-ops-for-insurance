"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { ExposureScenarioLogo } from "@/components/exposure-scenario-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { ConcentrationInsight, ExposureScenarioAnalysis, QuerySnippet, ScenarioResult } from "@/types/exposure-scenario";

interface AnalyzeResponse {
  analysis: ExposureScenarioAnalysis;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Exposure Scenario Modeller";

function formatDuration(ms: number | null): string {
  if (ms == null) return "00:00:00";
  const totalMilliseconds = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((totalMilliseconds % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${seconds}:${centiseconds}`;
}

function formatCurrency(value: number): string {
  return `GBP ${value.toLocaleString("en-GB")}`;
}

function statusTone(status: string): { label: string; dotClassName: string } {
  if (status === "stored") {
    return { label: "Supabase synced", dotClassName: "bg-[var(--dot-stored)]" };
  }

  if (status === "failed") {
    return { label: "Needs attention", dotClassName: "bg-[var(--dot-failed)]" };
  }

  if (status === "ready") {
    return { label: "Gate passed", dotClassName: "bg-[var(--dot-ready)]" };
  }

  return { label: "Pending credentials", dotClassName: "bg-[var(--dot-skipped)]" };
}

function StatusDot({ status, fallbackLabel }: { status: string; fallbackLabel?: string }) {
  const tone = statusTone(status);
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${tone.dotClassName}`} />
      {fallbackLabel ?? tone.label}
    </span>
  );
}

function MetaCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-subtle)] p-4 shadow-[0_10px_30px_rgba(120,53,15,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-3 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioResult }) {
  return (
    <div className="rounded-[24px] border border-[var(--panel-border)] bg-white/85 p-5 shadow-[0_18px_40px_rgba(120,53,15,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{scenario.scenarioId}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{scenario.title}</h3>
        </div>
        <div className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]">
          {scenario.lossRatioPct}% LR
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricPill label="Net modelled loss" value={formatCurrency(scenario.netModelledLossGbp)} />
        <MetricPill label="Gross modelled loss" value={formatCurrency(scenario.grossModelledLossGbp)} />
        <MetricPill label="Concentration load" value={`${scenario.concentrationLoadPct}%`} />
        <MetricPill label="Affected rows" value={String(scenario.affectedExposureCount)} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{scenario.commentary}</p>
      <p className="mt-3 text-sm font-medium text-slate-700">Top driver: {scenario.topDriver}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ConcentrationRow({ insight }: { insight: ConcentrationInsight }) {
  return (
    <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-white/90 px-4 py-4 md:grid-cols-[0.9fr_1.1fr_1fr_1.2fr] md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{insight.dimension}</p>
        <p className="mt-1 text-base font-semibold text-slate-900">{insight.label}</p>
      </div>
      <p className="text-sm text-slate-600">{insight.insight}</p>
      <p className="text-sm font-medium text-slate-700">{insight.sharePct}% of TIV across {insight.exposureCount} rows</p>
      <p className="text-sm font-semibold text-[var(--accent-strong)]">{formatCurrency(insight.stressedLossGbp)} stressed loss</p>
    </div>
  );
}

function QuerySnippetCard({ snippet }: { snippet: QuerySnippet }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_30px_rgba(120,53,15,0.06)]">
      <p className="text-sm font-semibold text-slate-900">{snippet.label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{snippet.rationale}</p>
      <pre className="mt-4 overflow-x-auto rounded-[18px] bg-slate-950 px-4 py-4 text-xs leading-6 text-amber-50">{snippet.snippet}</pre>
    </div>
  );
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [csvText, setCsvText] = useState<string>(demoSamples[0].csvText);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/exposurescenario/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Exposure scenario analysis failed.");
      return;
    }

    setAnalysisTimeMs(
      typeof data.processingTimeMs === "number"
        ? data.processingTimeMs
        : Math.round(performance.now() - startedAt)
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

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;

    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setCsvText(sample.csvText);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);

    const reader = new FileReader();
    reader.onload = () => setCsvText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsText(file);
  }

  const summary = result?.analysis.summary;
  const storageStatus = result?.persistence.status ?? "skipped";
  const gateStatus = result?.analysis.requiredFieldGate.passed ? "ready" : "failed";
  const sourceLabelForHeader = sourceLabel.replace(/\.(csv|tsv|txt|md)$/i, "");

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-[var(--hero-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(120,53,15,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-strong)] shadow-[0_12px_30px_rgba(120,53,15,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <ExposureScenarioLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 16 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{appName}</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Model baseline and stressed portfolio loss views from a simple exposure schedule, surface concentration pressure, and prepare analyst query snippets for the next drill-down.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current file" value={sourceLabelForHeader} />
              <MetaCard label="Storage" value={<StatusDot status={storageStatus} fallbackLabel={result ? undefined : "Awaiting run"} />} />
              <MetaCard label="Required-field gate" value={<StatusDot status={gateStatus} fallbackLabel={result ? undefined : "Not run yet"} />} />
              <MetaCard label="Mode" value="Deterministic baseline + stress scenarios" />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <Card eyebrow="Intake">
            <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-slate-900">Exposure portfolio</h2>
                <div className="rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5 shadow-[0_12px_30px_rgba(120,53,15,0.08)]">
                  <p className="text-sm font-semibold text-slate-700">Source input</p>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Use built-in samples, paste exposure rows, or load a local schedule extract with portfolio exposures.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-slate-900/90 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(15,23,42,0.35)]"
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
                      accept=".csv,.txt,text/plain"
                      className="hidden"
                      onChange={handleFileSelection}
                      ref={fileInputRef}
                      type="file"
                    />
                  </div>
                  <div className="mt-5 space-y-2">
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

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoSamples.map((sample) => {
                    const isActive = sample.id === selectedSampleId;
                    return (
                      <button
                        key={sample.id}
                        className={`rounded-[18px] border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_24px_rgba(180,83,9,0.2)]"
                            : "border-slate-200 bg-white/60 hover:border-[var(--accent)]/45"
                        }`}
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

              <div className="grid h-full grid-rows-[auto_auto_auto] items-start gap-5">
                <h2 className="text-left text-2xl font-semibold text-slate-900">Exposure CSV</h2>
                <div className="rounded-[26px] border border-slate-300 bg-white/65 p-4 overflow-hidden">
                  <textarea
                    className="h-[300px] w-full resize-none overflow-y-auto appearance-none rounded-none border-0 bg-transparent px-2 py-2 font-mono text-sm leading-7 text-slate-700 outline-none shadow-none ring-0 transition focus:border-0 focus:outline-none focus:ring-0 lg:mt-0"
                    id="csv-text"
                    onChange={(event) => setCsvText(event.target.value)}
                    value={csvText}
                  />
                </div>

                <div className="flex h-full flex-col justify-start gap-3 rounded-[24px] border border-slate-200 bg-white/65 p-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="question">
                      Query prompt
                    </label>
                    <input
                      className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-base text-slate-700 outline-none ring-1 ring-slate-300 transition focus:ring-1 focus:ring-[var(--accent)]"
                      id="question"
                      onChange={(event) => setQuestion(event.target.value)}
                      value={question}
                    />
                  </div>
                  <button
                    className="rounded-[26px] border border-[var(--accent)] bg-[var(--accent)]/95 px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(154,52,18,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Modeling..." : "Run scenario model"}
                  </button>
                  <p className="text-sm text-slate-500">
                    Required columns: exposure_id, account_name, country, peril, segment, tiv_gbp, attachment_gbp, limit_gbp.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card eyebrow="Result" title="Scenario outputs and review cues">
            <div className="space-y-5">
              {error ? (
                <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">{error}</div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaCard label="Rows modelled" value={summary ? String(summary.rowCount) : "-"} />
                <MetaCard label="Portfolio TIV" value={summary ? formatCurrency(summary.totalTivGbp) : "-"} />
                <MetaCard label="Baseline loss" value={summary ? formatCurrency(summary.baselineNetLossGbp) : "-"} />
                <MetaCard label="Stressed loss" value={summary ? formatCurrency(summary.stressedNetLossGbp) : "-"} />
                <MetaCard label="Stress delta" value={summary ? `${summary.stressDeltaPct}%` : "-"} />
                <MetaCard label="Request ID" value={result?.requestId ?? "Awaiting run"} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(result?.analysis.scenarios ?? []).map((scenario) => (
                  <ScenarioCard key={scenario.scenarioId} scenario={scenario} />
                ))}
                {!result ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-6 text-sm leading-6 text-slate-500 md:col-span-2">
                    Run the model to populate baseline and stressed scenario cards, concentration insights, and downstream query snippets.
                  </div>
                ) : null}
              </div>

              {result ? (
                <>
                  <div className="rounded-[24px] border border-[var(--panel-border)] bg-white/80 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Required-field gate</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-950">{result.analysis.requiredFieldGate.rationale}</h3>
                      </div>
                      <StatusDot status={result.analysis.requiredFieldGate.passed ? "ready" : "failed"} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {result.analysis.requiredFieldGate.fields.map((field) => (
                        <MetricPill
                          key={field.fieldName}
                          label={field.fieldName}
                          value={`${field.coveragePct}% (${field.matchedRows}/${field.totalRows})`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Concentration insights</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-950">Where the stress view clusters</h3>
                      </div>
                      <p className="text-sm text-slate-500">Sorted by stressed loss contribution</p>
                    </div>
                    <div className="space-y-3">
                      {result.analysis.concentrationInsights.map((insight) => (
                        <ConcentrationRow key={`${insight.dimension}-${insight.label}`} insight={insight} />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Query snippets</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">Prepared drill-down snippets</h3>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {result.analysis.querySnippets.map((snippet) => (
                        <QuerySnippetCard key={snippet.label} snippet={snippet} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[var(--panel-border)] bg-white/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Commentary</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">Executive take</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{result.analysis.commentary.executiveSummary}</p>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Observations</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                          {result.analysis.commentary.observations.map((observation) => (
                            <li key={observation}>• {observation}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                          {result.analysis.commentary.actions.map((action) => (
                            <li key={action}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {result.analysis.warnings.length > 0 ? (
                      <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-900">Warnings</p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                          {result.analysis.warnings.map((warning) => (
                            <li key={warning}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {result.persistence.reason ? (
                      <p className="mt-4 text-sm text-slate-500">Storage note: {result.persistence.reason}</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

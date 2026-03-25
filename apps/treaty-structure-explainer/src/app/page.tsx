"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { demoSamples } from "@/lib/demo-samples";
import type { LayerBand, LossScenario, TreatyInsight, TreatyWarning } from "@/types/treaty-structure";

interface AnalyzeResponse {
  analysis: TreatyInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

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

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [treatyText, setTreatyText] = useState<string>(demoSamples[0].treatyText);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/treatystructure/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ treatyText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Treaty structure analysis failed.");
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
      .finally(() => setIsPending(false));
  }

  function loadSample(sampleId: string) {
    const sample = demoSamples.find((item) => item.id === sampleId);
    if (!sample) return;

    setSelectedSampleId(sample.id);
    setSourceLabel(sample.sourceLabel);
    setTreatyText(sample.treatyText);
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
    reader.onload = () => setTreatyText(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-white/40 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-teal-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">Day 12 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">30 Useful Insurance and Productivity Apps | Treaty Structure Explainer</p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">Treaty Structure Explainer</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Parse treaty wording, visualise layer response, and explain who pays through loss bands in clear underwriting language.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={result ? (result.persistence.status === "stored" ? "Supabase synced" : result.persistence.status === "failed" ? "Needs attention" : "Pending credentials") : "Awaiting run"} />
              <MetaCard label="Mode" value="Treaty layer interpretation and loss flow" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Treaty source and wording">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Treaty source</label>
                <div className="flex min-h-[310px] flex-col rounded-[26px] border border-dashed border-teal-700/45 bg-white/70 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Upload zone</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Use built-in samples, paste treaty wording, or load a local `.txt`/`.pdf` extract.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => fileInputRef.current?.click()} type="button">Select File</button>
                      <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => loadSample(demoSamples[0].id)} type="button">Reset sample</button>
                      <input accept=".txt,.pdf,text/plain" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
                    </div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="source-label">Source label</label>
                    <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-teal-700" id="source-label" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {demoSamples.map((sample) => {
                  const isActive = sample.id === selectedSampleId;
                  return (
                    <button key={sample.id} onClick={() => loadSample(sample.id)} type="button" className={`rounded-[18px] border px-3 py-3 text-left transition ${isActive ? "border-teal-700 bg-teal-50 shadow-[0_12px_24px_rgba(20,184,166,0.2)]" : "border-slate-200 bg-white/60 hover:border-teal-700/45"}`}>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{sample.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="treaty-text">Treaty wording</label>
                <textarea className="min-h-[310px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-teal-700" id="treaty-text" onChange={(event) => setTreatyText(event.target.value)} value={treatyText} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="question">Query prompt</label>
                <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-teal-700" id="question" onChange={(event) => setQuestion(event.target.value)} value={question} />
              </div>
              <div className="space-y-3">
                <button className="rounded-full bg-teal-700 px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(15,118,110,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65" disabled={isPending} onClick={submit} type="button">
                  {isPending ? "Analyzing..." : "Explain treaty"}
                </button>
                <p className="text-sm text-slate-500">Runs deterministic treaty parsing and loss-flow explanation checks through the app route.</p>
              </div>
              {error ? <StatusLine tone="issue" text={error} /> : null}
              {result?.persistence.reason ? <StatusLine tone="warn" text={result.persistence.reason} /> : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Terms" title="Parsed treaty fields">
            {result ? (
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                <li>Treaty type: {result.analysis.terms.treatyType}</li>
                <li>Subject business: {result.analysis.terms.subjectBusiness}</li>
                <li>Territory: {result.analysis.terms.territory}</li>
                <li>Attachment: {formatCurrency(result.analysis.terms.attachmentGbp)}</li>
                <li>Limit: {formatCurrency(result.analysis.terms.limitGbp)}</li>
                <li>Signed share: {result.analysis.terms.signedSharePct.toFixed(1)}%</li>
                <li>Ceding commission: {result.analysis.terms.cedingCommissionPct.toFixed(1)}%</li>
                <li>Reinstatements: {result.analysis.terms.reinstatements}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to view treaty terms.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((hit) => (
                    <li key={hit}>{hit}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Query snippets appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Flow" title="Loss flow by treaty layer">
          {result ? <LayerTable layers={result.analysis.layerBands} /> : <p className="text-sm text-slate-500">Layer flow appears after analysis.</p>}
        </Card>

        <Card eyebrow="Scenarios" title="Loss walkthrough">
          {result ? <ScenarioTable scenarios={result.analysis.scenarios} /> : <p className="text-sm text-slate-500">Scenarios appear after analysis.</p>}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Warnings" title="Structure warnings">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <WarningList warnings={result.analysis.warnings} />
              ) : (
                <StatusLine tone="ok" text="No structure warnings were raised for this treaty input." />
              )
            ) : (
              <p className="text-sm text-slate-500">Warnings appear after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Commentary" title="Executive readout">
            {result ? <p className="text-sm leading-6 text-slate-700">{result.analysis.commentary}</p> : <p className="text-sm text-slate-500">Run an analysis to generate commentary.</p>}
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </article>
  );
}

function WarningList({ warnings }: { warnings: TreatyWarning[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {warnings.map((warning) => (
        <li key={warning.code} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="flex items-center gap-2 font-semibold text-amber-700">
            <StatusDot tone="warn" />
            <span>{warning.severity.toUpperCase()} · {warning.code.replace(/_/g, " ")}</span>
          </p>
          <p>{warning.message}</p>
        </li>
      ))}
    </ul>
  );
}

function StatusLine({ tone, text }: { tone: "ok" | "warn" | "issue"; text: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm ${tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-red-600"}`}>
      <StatusDot tone={tone} />
      <span>{text}</span>
    </p>
  );
}

function StatusDot({ tone }: { tone: "ok" | "warn" | "issue" }) {
  const palette = tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-red-500";
  return <span aria-hidden className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${palette}`} />;
}

function LayerTable({ layers }: { layers: LayerBand[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <th className="px-3 py-2">Band</th>
            <th className="px-3 py-2">From</th>
            <th className="px-3 py-2">To</th>
            <th className="px-3 py-2">Payer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {layers.map((layer) => (
            <tr key={layer.label}>
              <td className="px-3 py-2 font-medium">{layer.label}</td>
              <td className="px-3 py-2">{formatCurrency(layer.fromGbp)}</td>
              <td className="px-3 py-2">{formatCurrency(layer.toGbp)}</td>
              <td className="px-3 py-2">{layer.payer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioTable({ scenarios }: { scenarios: LossScenario[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <th className="px-3 py-2">Scenario</th>
            <th className="px-3 py-2">Gross loss</th>
            <th className="px-3 py-2">Cedant retained</th>
            <th className="px-3 py-2">Reinsurer paid</th>
            <th className="px-3 py-2">Above limit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {scenarios.map((scenario) => (
            <tr key={scenario.title}>
              <td className="px-3 py-2 font-medium">{scenario.title}</td>
              <td className="px-3 py-2">{formatCurrency(scenario.grossLossGbp)}</td>
              <td className="px-3 py-2">{formatCurrency(scenario.cedantRetainedGbp)}</td>
              <td className="px-3 py-2">{formatCurrency(scenario.reinsurerPaidGbp)}</td>
              <td className="px-3 py-2">{formatCurrency(scenario.uninsuredAboveLimitGbp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

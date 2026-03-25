"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState } from "react";

import { MrcCheckerLogo } from "@/components/mrc-checker-logo";
import { demoSamples } from "@/lib/demo-samples";
import type { MrcInsight } from "@/types/mrc-checker";

interface AnalyzeResponse {
  analysis: MrcInsight;
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

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  return `${minutes}:${seconds}:${centiseconds}`;
}

async function extractPdfText(file: File): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs")]);
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
  }
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const chunks: string[] = [];
  for (let page = 1; page <= pdf.numPages; page += 1) {
    const pageData = await pdf.getPage(page);
    const textContent = await pageData.getTextContent();
    chunks.push(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim()
    );
  }
  return chunks.filter(Boolean).join("\n\n");
}

function Dot({ tone }: { tone: "ok" | "warn" | "issue" }) {
  const color = tone === "ok" ? "#15803d" : tone === "warn" ? "#d97706" : "#dc2626";
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mrcText, setMrcText] = useState<string>(demoSamples[0].mrcText);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [question, setQuestion] = useState<string>(demoSamples[0].question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/mrcchecker/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mrcText,
        question,
        sourceLabel
      })
    });

    const payload = (await response.json()) as AnalyzeResponse | { error: string };
    if (!response.ok || "error" in payload) {
      setResult(null);
      setError("error" in payload ? payload.error : "MRC check failed.");
      return;
    }

    setResult(payload);
    setAnalysisTimeMs(payload.processingTimeMs ?? Math.round(performance.now() - startedAt));
  }

  function run() {
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
    setMrcText(sample.mrcText);
    setQuestion(sample.question);
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

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      void extractPdfText(file)
        .then((text) => {
          if (!text.trim()) {
            setError("No extractable text found in the selected PDF.");
            return;
          }
          setMrcText(text);
        })
        .catch(() => setError("Unable to extract text from the selected PDF."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setMrcText(text);
    };
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
                  <MrcCheckerLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Day 17 Internal Tool</p>
                  <p className="text-sm font-medium text-slate-500">30 Useful Insurance and Productivity Apps | MRC Checker</p>
                </div>
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">MRC Checker</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                Validate MRC wording for required fields, clause presence, and reviewer attention points before final
                sign-off.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
              <MetaCard label="Analysis and review time (MM:SS:CS)" value={formatDuration(analysisTimeMs)} />
              <MetaCard label="Current source" value={sourceLabel} />
              <MetaCard label="Storage" value={result ? (result.persistence.status === "stored" ? "Supabase synced" : result.persistence.status === "failed" ? "Needs attention" : "Pending credentials") : "Awaiting run"} />
              <MetaCard label="Mode" value="MRC compliance and clause checks" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="MRC source and content">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">MRC source</label>
                <div className="rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upload zone</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Use built-in samples, paste MRC wording, or load a local `.txt` / `.pdf` extract.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={() => fileInputRef.current?.click()} type="button">
                      Select File
                    </button>
                    <input accept=".txt,.pdf,text/plain,application/pdf" className="hidden" onChange={handleFileSelection} ref={fileInputRef} type="file" />
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
              <label className="block text-sm font-semibold text-slate-700">MRC wording</label>
              <textarea className="min-h-[285px] w-full resize-y rounded-3xl border border-slate-300 bg-white/80 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" onChange={(event) => setMrcText(event.target.value)} value={mrcText} />
              <label className="block text-sm font-semibold text-slate-700">Query prompt</label>
              <input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700" onChange={(event) => setQuestion(event.target.value)} value={question} />
              <button className="inline-flex min-w-[190px] items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending || mrcText.trim().length < 80} onClick={run} type="button">
                {isPending ? "Running..." : "Check MRC"}
              </button>
              <p className="text-sm text-slate-500">Runs deterministic MRC extraction and clause checks through the app route.</p>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              {result?.persistence.status === "failed" && result.persistence.reason ? (
                <p className="text-sm font-medium text-amber-700">{result.persistence.reason}</p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card eyebrow="Summary" title="MRC gate">
            {result ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2"><Dot tone={result.analysis.summary.gatePassed ? "ok" : "issue"} /> Gate: {result.analysis.summary.gatePassed ? "Passed" : "Failed"}</p>
                <p>Field coverage: {result.analysis.summary.fieldCoverage}%</p>
                <p>Warnings: {result.analysis.summary.warningCount}</p>
                <p>Referrals: {result.analysis.summary.referralCount}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run a check to view summary metrics.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result && result.analysis.query.hits.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {result.analysis.query.hits.map((hit, index) => (
                  <li key={`${hit.section}-${index}`}>[{hit.section}] {hit.snippet}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
            )}
          </Card>

          <Card eyebrow="Fields" title="Required-field table">
            {result ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Field</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.analysis.fieldChecks.map((field) => (
                      <tr className="border-t border-slate-200" key={field.fieldKey}>
                        <td className="px-2 py-2 font-medium text-slate-700">{field.label}</td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center gap-2">
                            <Dot tone={field.status === "matched" ? "ok" : field.status === "attention" ? "warn" : "issue"} />
                            {field.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-600">{field.extractedValue ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Field checks appear after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Clauses" title="Clause checks">
            {result ? (
              <ul className="space-y-3 text-sm text-slate-700">
                {result.analysis.clauseChecks.map((clause) => (
                  <li className="rounded-2xl border border-slate-200 bg-white/70 p-3" key={clause.clauseKey}>
                    <p className="flex items-center justify-between font-medium">
                      {clause.label}
                      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                        <Dot tone={clause.status === "present" ? "ok" : clause.status === "attention" ? "warn" : "issue"} />
                        {clause.status}
                      </span>
                    </p>
                    <p className="mt-1 text-slate-600">{clause.rationale}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Clause checks appear after analysis.</p>
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


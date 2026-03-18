"use client";

import { AppGroupLogo, Card, ClassOfBusinessLogo } from "@ai-ops/common-ui";
import { demoSamples } from "@/lib/demo-samples";
import type { CobInsight } from "@/types/class-of-business";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: CobInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const appProjectName = "30 Useful Insurance and Productivity Apps";
const appName = "Class of Business Classifier";

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

async function extractPdfText(file: File): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs")]);

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
  }

  const pdfData = await file.arrayBuffer();
  const pdf = await getDocument({ data: pdfData }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [riskText, setRiskText] = useState<string>(demoSamples[0].riskText);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(demoSamples[0].sourceLabel);
  const [question, setQuestion] = useState<string>(
    "What class of business is most likely and what should be reviewed manually?"
  );
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/classofbusiness/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        riskText,
        sourceLabel,
        question
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Class-of-business analysis failed.");
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
    setRiskText(sample.riskText);
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

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      void extractPdfText(file)
        .then((text) => {
          if (!text.trim()) {
            setError("No extractable text found in the selected PDF.");
            return;
          }
          setRiskText(text);
        })
        .catch(() => {
          setError("Unable to extract text from the selected PDF.");
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setRiskText(text);
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
                  <ClassOfBusinessLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    Day 5 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {appProjectName} | {appName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  {appName}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Paste a risk narrative, classify likely London Market class-of-business labels, and surface
                  confidence, ambiguity, and reviewer actions.
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
              <MetaCard label="Mode" value="Class prediction and ambiguity review" />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Risk source and description">
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Risk source</label>
                  <div className="flex min-h-[280px] flex-col rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Upload zone
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Use sample narratives, paste risk text, or load a local `.txt` or `.pdf`.
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
                          accept=".txt,text/plain,.pdf,application/pdf"
                          className="hidden"
                          onChange={handleFileSelection}
                          ref={fileInputRef}
                          type="file"
                        />
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-4">
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
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoSamples.map((sample) => (
                    <button
                      className={`rounded-[20px] border p-3 text-left transition ${
                        selectedSampleId === sample.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--panel-border)] bg-white/72"
                      }`}
                      key={sample.id}
                      onClick={() => loadSample(sample.id)}
                      type="button"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {sample.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{sample.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="riskText">
                    Risk description
                  </label>
                  <textarea
                    className="min-h-[280px] w-full rounded-[16px] border border-slate-300 bg-white px-5 py-4 text-sm leading-7 text-slate-800 outline-none ring-0"
                    id="riskText"
                    onChange={(event) => setRiskText(event.target.value)}
                    value={riskText}
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

                <div className="flex flex-col items-center gap-2 pt-1">
                  <button
                    className="rounded-full bg-[var(--accent)] px-12 py-3 text-base font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={submit}
                    type="button"
                  >
                    {isPending ? "Analyzing..." : "Classify risk"}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Runs deterministic class-of-business scoring and ambiguity checks through the app route.
                  </p>
                </div>
                {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Result" title="Top class recommendation">
            {result ? (
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-slate-900">{result.analysis.summary.topLabel}</p>
                <p className="text-sm text-slate-700">
                  Confidence: <strong>{Math.round(result.analysis.summary.topConfidence * 100)}%</strong> ({result.analysis.summary.confidenceBand})
                </p>
                <p className="text-sm text-slate-700">
                  Ambiguous: <strong>{result.analysis.summary.ambiguous ? "Yes" : "No"}</strong>
                </p>
                <p className="text-sm text-slate-700">{result.analysis.commentary.executiveSummary}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Run an analysis to view the recommended class.</p>
            )}
          </Card>

          <Card eyebrow="Warnings" title="Review triggers">
            {result ? (
              result.analysis.warnings.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.warnings.map((warning) => (
                    <li key={warning.code}>- {warning.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">No warning triggers for this classification run.</p>
              )
            ) : (
              <p className="text-sm text-slate-600">Warnings will appear after classification.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Alternatives" title="Ranked class candidates">
          {result ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-3 py-2 font-semibold">Class</th>
                    <th className="px-3 py-2 font-semibold">Confidence</th>
                    <th className="px-3 py-2 font-semibold">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.candidates.map((candidate) => (
                    <tr className="border-b border-slate-100 text-slate-800" key={candidate.label}>
                      <td className="px-3 py-2 font-medium">{candidate.label}</td>
                      <td className="px-3 py-2">{Math.round(candidate.confidence * 100)}%</td>
                      <td className="px-3 py-2">{candidate.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Candidate ranking will render after analysis.</p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Signals" title="Keyword evidence">
            {result ? (
              result.analysis.keywordSignals.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.keywordSignals.slice(0, 10).map((signal, index) => (
                    <li key={`${signal.label}-${signal.keyword}-${index}`}>
                      - [{signal.label}] {signal.keyword} ({signal.rationale})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">No deterministic signals were detected.</p>
              )
            ) : (
              <p className="text-sm text-slate-600">Detected keyword signals will appear here.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.query.hits.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.query.hits.map((hit, index) => (
                    <li key={`${hit.fieldName}-${index}`}>- {hit.snippet}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">No snippet matched the current query prompt.</p>
              )
            ) : (
              <p className="text-sm text-slate-600">Query snippet matches will appear here after classification.</p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

"use client";

import { AppGroupLogo, Card, PortfolioMixLogo } from "@ai-ops/common-ui";
import { demoSamples } from "@/lib/demo-samples";
import type { PortfolioInsight } from "@/types/portfolio";
import { useRef, useState } from "react";

interface AnalyzeResponse {
  analysis: PortfolioInsight;
  persistence: {
    status: string;
    reason?: string;
  };
  requestId: string;
}

const projectName = "AI Ops for Insurance | 30 Useful Insurance & Productivity Apps";

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState<string>(demoSamples[0].csvText);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(demoSamples[0].id);
  const [sourceLabel, setSourceLabel] = useState<string>(`${demoSamples[0].id}.csv`);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function runAnalysis() {
    const response = await fetch("/api/portfoliomix/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        csvText,
        sourceLabel
      })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Portfolio analysis failed.");
      return;
    }

    setResult(data);
  }

  function submit() {
    setError(null);
    setIsPending(true);

    void runAnalysis()
      .catch((requestError) => {
        setResult(null);
        setError(
          requestError instanceof Error ? requestError.message : "Unknown request failure."
        );
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
    setSourceLabel(`${sample.id}.csv`);
    setCsvText(sample.csvText);
    setError(null);
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setSelectedSampleId("uploaded");
      setSourceLabel(file.name);
      setCsvText(text);
      setError(null);
    };
    reader.onerror = () => {
      setError("Unable to read the selected file.");
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)]">
                  <PortfolioMixLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    Day 2 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">{projectName}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  Portfolio Mix Dashboard
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Upload or paste a portfolio schedule, then surface class, territory, and limit
                  concentration with commentary and warning flags for underwriting review.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" />
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
              <MetaCard label="Mode" value="Portfolio concentration review" />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card eyebrow="Intake" title="Portfolio source">
            <div className="space-y-5">
              <div className="rounded-[26px] border border-dashed border-[var(--accent)]/45 bg-white/70 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Upload zone
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Use one of the built-in demo samples, paste raw CSV rows, or load a local file.
                  The Day 2 route performs deterministic parsing, aggregation, commentary, and
                  concentration warning generation.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Select CSV
                  </button>
                  <button
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    onClick={() => loadSample("balanced")}
                    type="button"
                  >
                    Reset sample
                  </button>
                  <input
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileSelection}
                    ref={fileInputRef}
                    type="file"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {demoSamples.map((sample) => (
                  <button
                    className={`rounded-[24px] border p-4 text-left transition ${
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
                    <p className="mt-3 text-sm leading-6 text-slate-700">{sample.description}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="sourceLabel">
                  Source label
                </label>
                <input
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
                  id="sourceLabel"
                  onChange={(event) => setSourceLabel(event.target.value)}
                  value={sourceLabel}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="csvText">
                  Portfolio CSV
                </label>
                <textarea
                  className="min-h-80 w-full rounded-[22px] border border-slate-300 bg-white px-5 py-4 text-sm leading-7 text-slate-800 outline-none ring-0"
                  id="csvText"
                  onChange={(event) => setCsvText(event.target.value)}
                  value={csvText}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={submit}
                  type="button"
                >
                  {isPending ? "Analyzing..." : "Analyze portfolio"}
                </button>
                <p className="text-sm text-slate-500">
                  Current flow analyzes pasted or uploaded CSV locally through the app route.
                </p>
              </div>
              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
            </div>
          </Card>

          <div className="space-y-6">
            <Card eyebrow="Commentary" title="Executive readout">
              {result ? (
                <div className="space-y-4">
                  <p className="text-base font-semibold text-slate-900">
                    {result.analysis.commentary.executiveSummary}
                  </p>
                  <ul className="space-y-3 text-sm leading-6 text-slate-700">
                    {result.analysis.commentary.observations.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Run the analysis to generate the first portfolio summary and underwriting
                  commentary.
                </p>
              )}
            </Card>

            <Card eyebrow="Warnings" title="Concentration triggers">
              {result ? (
                result.analysis.warnings.length > 0 ? (
                  <div className="space-y-3">
                    {result.analysis.warnings.map((warning) => (
                      <div
                        className={`rounded-[20px] border px-4 py-3 ${
                          warning.severity === "high"
                            ? "border-red-200 bg-red-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                        key={`${warning.dimension}-${warning.label}`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {warning.dimension} concentration: {warning.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    No warning thresholds were triggered for the current portfolio sample.
                  </p>
                )
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Warning cards appear here when class, territory, or large-limit concentration
                  crosses the current thresholds.
                </p>
              )}
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card eyebrow="Class mix" title="Distribution">
            {result ? (
              <DistributionList items={result.analysis.summary.classDistribution} />
            ) : (
              <EmptyState text="Class distribution will appear after analysis." />
            )}
          </Card>

          <Card eyebrow="Territory mix" title="Distribution">
            {result ? (
              <DistributionList items={result.analysis.summary.territoryDistribution} />
            ) : (
              <EmptyState text="Territory distribution will appear after analysis." />
            )}
          </Card>

          <Card eyebrow="Limit bands" title="Distribution">
            {result ? (
              <DistributionList items={result.analysis.summary.limitBandDistribution} />
            ) : (
              <EmptyState text="Limit-band distribution will appear after analysis." />
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card eyebrow="Actions" title="Underwriting next steps">
            {result ? (
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {result.analysis.commentary.actions.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            ) : (
              <EmptyState text="Action guidance will appear after commentary is generated." />
            )}
          </Card>

          <Card eyebrow="Persistence" title="Storage status">
            <p className="text-sm leading-6 text-slate-600">
              {result
                ? result.persistence.status === "stored"
                  ? "Result stored in Supabase."
                  : `Storage ${result.persistence.status}. ${result.persistence.reason ?? ""}`.trim()
                : "Supabase storage is optional. If server credentials exist, the analysis run is stored in the Day 2 schema."}
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/78 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DistributionList({
  items
}: {
  items: Array<{ label: string; count: number; share: number }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="space-y-2" key={item.label}>
          <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{item.label}</span>
            <span>
              {item.count} rows / {Math.round(item.share * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.max(8, Math.round(item.share * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-slate-600">{text}</p>;
}

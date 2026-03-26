"use client";

import { AppGroupLogo, Card } from "@ai-ops/common-ui";
import { useRef, useState, type ChangeEvent } from "react";

import { demoSamples } from "@/lib/demo-samples";
import type {
  BrokerSubmissionInsight,
  InformationGap,
  ReferralFlag,
  StatusTone,
  SubmissionSection,
  SubmissionStatusMetric
} from "@/types/broker-submission";

interface AnalyzeResponse {
  analysis: BrokerSubmissionInsight;
  persistence: {
    reason?: string;
    status: string;
  };
  processingTimeMs?: number;
  requestId: string;
}

const initialSample = demoSamples[0];

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

function toneClasses(tone: StatusTone): string {
  if (tone === "green") return "text-emerald-700";
  if (tone === "amber") return "text-amber-700";
  return "text-red-600";
}

function persistenceTone(status?: string): StatusTone {
  if (status === "stored") return "green";
  if (status === "failed") return "red";
  return "amber";
}

function storageLabel(status?: string): string {
  if (status === "stored") return "Supabase synced";
  if (status === "failed") return "Needs attention";
  if (status === "skipped") return "Pending credentials";
  return "Awaiting run";
}

function toWhitespaceRows(
  fields: BrokerSubmissionInsight["fields"]
): Array<{ label: string; value: string; status: "EXTRACTED" | "MISSING" }> {
  const mapRow = (label: string, raw: string | number, value: string) => {
    const hasValue =
      typeof raw === "number"
        ? Number.isFinite(raw)
        : raw.trim().length > 0 && raw.trim().toLowerCase() !== "n/a";
    return {
      label,
      value,
      status: hasValue ? ("EXTRACTED" as const) : ("MISSING" as const)
    };
  };

  return [
    mapRow("Broker", fields.broker, fields.broker),
    mapRow("Insured Name", fields.insuredName, fields.insuredName),
    mapRow("Class Of Business", fields.classOfBusiness, fields.classOfBusiness),
    mapRow("Territory", fields.territory, fields.territory),
    mapRow("Inception Date", fields.inceptionDate, fields.inceptionDate),
    mapRow("Requested Limit (GBP)", fields.requestedLimitGbp, formatCurrency(fields.requestedLimitGbp)),
    mapRow("Attachment (GBP)", fields.attachmentGbp, formatCurrency(fields.attachmentGbp)),
    mapRow(
      "Estimated Premium (GBP)",
      fields.estimatedPremiumGbp,
      formatCurrency(fields.estimatedPremiumGbp)
    ),
    mapRow("Revenue (GBP)", fields.revenueGbp, formatCurrency(fields.revenueGbp)),
    mapRow("Occupancies", fields.occupancies, fields.occupancies),
    mapRow("Claims Summary", fields.claimsSummary, fields.claimsSummary),
    mapRow("Security Requirements", fields.securityRequirements, fields.securityRequirements),
    mapRow("Target Quote By", fields.targetQuoteBy, fields.targetQuoteBy),
    mapRow("Narrative", fields.narrative, fields.narrative)
  ];
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState(initialSample.id);
  const [sourceLabel, setSourceLabel] = useState(initialSample.sourceLabel);
  const [submissionText, setSubmissionText] = useState(initialSample.submissionText);
  const [question, setQuestion] = useState(initialSample.question);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [analysisTimeMs, setAnalysisTimeMs] = useState<number | null>(null);

  async function runAnalysis() {
    const startedAt = performance.now();
    const response = await fetch("/api/brokersubmission/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionText, sourceLabel, question })
    });

    const data = (await response.json()) as AnalyzeResponse | { error: string };

    if (!response.ok || "error" in data) {
      setResult(null);
      setError("error" in data ? data.error : "Broker submission analysis failed.");
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
    setSubmissionText(sample.submissionText);
    setQuestion(sample.question);
    setError(null);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedSampleId("uploaded");
    setSourceLabel(file.name);

    const reader = new FileReader();
    reader.onload = () => setSubmissionText(typeof reader.result === "string" ? reader.result : "");
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
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  <AppGroupLogo className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Day 15 Internal Tool
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    30 Useful Insurance and Productivity Apps | Broker Submission Builder
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  Broker Submission Builder
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Convert broker notes into a deterministic market summary, highlight referral triggers,
                  and surface the follow-up items needed before release.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[26rem]">
              <MetaCard label="Created by" value="Poovannan Rajendran" tone="green" />
              <MetaCard
                label="Analysis and review time (MM:SS:CS)"
                value={formatDuration(analysisTimeMs)}
                tone="green"
              />
              <MetaCard label="Current source" value={sourceLabel} tone="amber" />
              <MetaCard
                label="Storage"
                value={storageLabel(result?.persistence.status)}
                tone={persistenceTone(result?.persistence.status)}
              />
              <MetaCard
                label="Mode"
                value="Submission structuring and referral gating"
                tone="green"
              />
            </div>
          </div>
        </section>

        <Card eyebrow="Intake" title="Broker source and submission note">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Broker source</label>
                <div className="flex min-h-[320px] flex-col rounded-[26px] border border-dashed border-emerald-700/45 bg-white/70 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Upload zone
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Use built-in broker note samples, paste structured text, or load a local
                      `.txt` or `.md` file from a renewal or new business pack.
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
                        onClick={() => loadSample(initialSample.id)}
                        type="button"
                      >
                        Reset sample
                      </button>
                      <input
                        accept=".txt,.md,text/plain"
                        className="hidden"
                        onChange={handleFileSelection}
                        ref={fileInputRef}
                        type="file"
                      />
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="source-label">
                      Source label
                    </label>
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-emerald-700"
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
                      key={sample.id}
                      className={`rounded-[18px] border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-emerald-700 bg-emerald-50 shadow-[0_12px_24px_rgba(22,101,52,0.16)]"
                          : "border-slate-200 bg-white/60 hover:border-emerald-700/45"
                      }`}
                      onClick={() => loadSample(sample.id)}
                      type="button"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {sample.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{sample.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="submission-text">
                  Submission note
                </label>
                <textarea
                  className="min-h-[320px] w-full rounded-[18px] border border-slate-300 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-emerald-700"
                  id="submission-text"
                  onChange={(event) => setSubmissionText(event.target.value)}
                  value={submissionText}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="question">
                  Query prompt
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-emerald-700"
                  id="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  value={question}
                />
              </div>
              <div className="space-y-3">
                <button
                  className="rounded-full bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-[0_16px_30px_rgba(21,128,61,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={isPending}
                  onClick={submit}
                  type="button"
                >
                  {isPending ? "Analyzing..." : "Build submission"}
                </button>
                <p className="text-sm text-slate-500">
                  Runs the deterministic submission builder, required-field gate, and persistence flow
                  through the app route.
                </p>
              </div>
              {error ? <StatusLine tone="red" text={error} /> : null}
              {result?.persistence.reason ? (
                <StatusLine tone={persistenceTone(result.persistence.status)} text={result.persistence.reason} />
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card eyebrow="Summary" title="Build overview">
            {result ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricBox
                  label="Completeness"
                  tone={result.analysis.summary.completenessPct >= 90 ? "green" : "amber"}
                  value={`${result.analysis.summary.completenessPct}%`}
                />
                <MetricBox
                  label="Referral triggers"
                  tone={
                    result.analysis.summary.referralCount === 0
                      ? "green"
                      : result.analysis.summary.redFlagCount > 0
                        ? "red"
                        : "amber"
                  }
                  value={String(result.analysis.summary.referralCount)}
                />
                <MetricBox
                  label="Information gaps"
                  tone={
                    result.analysis.summary.informationGapCount === 0
                      ? "green"
                      : result.analysis.summary.informationGapCount >= 3
                        ? "red"
                        : "amber"
                  }
                  value={String(result.analysis.summary.informationGapCount)}
                />
                <MetricBox
                  label="Market stance"
                  tone={result.analysis.summary.readiness === "ready" ? "green" : "amber"}
                  value={result.analysis.summary.readiness === "ready" ? "Ready" : "Referral"}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run analysis to see summary metrics.</p>
            )}
          </Card>

          <Card eyebrow="Status" title="Readiness board">
            {result ? (
              <div className="space-y-3">
                {result.analysis.statusMetrics.map((metric) => (
                  <StatusMetricRow key={metric.label} metric={metric} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Status metrics appear after analysis.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card eyebrow="Structured fields" title="Parsed submission details">
            {result ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <FieldRow label="Broker" value={result.analysis.fields.broker} />
                <FieldRow label="Insured" value={result.analysis.fields.insuredName} />
                <FieldRow label="Class" value={result.analysis.fields.classOfBusiness} />
                <FieldRow label="Territory" value={result.analysis.fields.territory} />
                <FieldRow label="Inception" value={result.analysis.fields.inceptionDate} />
                <FieldRow label="Target quote by" value={result.analysis.fields.targetQuoteBy} />
                <FieldRow label="Requested limit" value={formatCurrency(result.analysis.fields.requestedLimitGbp)} />
                <FieldRow label="Attachment" value={formatCurrency(result.analysis.fields.attachmentGbp)} />
                <FieldRow
                  label="Estimated premium"
                  value={formatCurrency(result.analysis.fields.estimatedPremiumGbp)}
                />
                <FieldRow label="Revenue" value={formatCurrency(result.analysis.fields.revenueGbp)} />
                <FieldRow label="Occupancies" value={result.analysis.fields.occupancies} />
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Run analysis to view parsed submission fields.</p>
            )}
          </Card>

          <Card eyebrow="Query" title="Prompt match snippets">
            {result ? (
              result.analysis.queryHits.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {result.analysis.queryHits.map((hit, index) => (
                    <li key={`${hit}-${index}`}>{hit}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets matched the query tokens in this run.</p>
              )
            ) : (
              <p className="text-sm text-slate-500">Prompt matches appear once analysis is complete.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Build output" title="Submission sections">
          {result ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {result.analysis.sections.map((section, index) => (
                <SectionCard key={`${section.title}-${index}`} section={section} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Structured submission sections appear after analysis.</p>
          )}
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card eyebrow="Referral triggers" title="Automatic referral checks">
            {result ? (
              result.analysis.referralFlags.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.referralFlags.map((flag) => (
                    <ReferralFlagRow key={`${flag.code}-${flag.message}`} flag={flag} />
                  ))}
                </div>
              ) : (
                <StatusLine tone="green" text="No automatic referral triggers were raised." />
              )
            ) : (
              <p className="text-sm text-slate-500">Referral triggers appear after analysis.</p>
            )}
          </Card>

          <Card eyebrow="Follow-up" title="Information gaps">
            {result ? (
              result.analysis.informationGaps.length > 0 ? (
                <div className="space-y-3">
                  {result.analysis.informationGaps.map((gap) => (
                    <InformationGapRow key={gap.label} gap={gap} />
                  ))}
                </div>
              ) : (
                <StatusLine tone="green" text="No additional follow-up items were generated." />
              )
            ) : (
              <p className="text-sm text-slate-500">Information gaps appear after analysis.</p>
            )}
          </Card>
        </div>

        <Card eyebrow="Commentary" title="Executive readout">
          <p className="text-base leading-7 text-slate-700">
            {result
              ? result.analysis.commentary
              : "Upload a broker note and run the builder to generate the executive submission readout."}
          </p>
        </Card>

        <Card eyebrow="Whitespace" title="Whitespace fields/columns table">
          {result ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-2xl border border-slate-200 bg-white/80">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Field wording
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Extraction status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Extracted value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {toWhitespaceRows(result.analysis.fields).map((row) => (
                    <tr key={row.label} className="align-top">
                      <td className="w-[28%] border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                        {row.label}
                      </td>
                      <td className="w-[18%] border-b border-slate-200 px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.12em] ${
                            row.status === "EXTRACTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Whitespace field mapping appears after analysis.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetaCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3">
      <div className="flex items-center gap-2">
        <StatusDot tone={tone} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function MetricBox({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-2">
        <StatusDot tone={tone} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusMetricRow({ metric }: { metric: SubmissionStatusMetric }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <StatusDot tone={metric.tone} />
        <div>
          <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
          <p className={`text-sm ${toneClasses(metric.tone)}`}>{metric.value}</p>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-slate-800">{value}</dd>
    </div>
  );
}

function StatusLine({ tone, text }: { tone: StatusTone; text: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm ${toneClasses(tone)}`}>
      <StatusDot tone={tone} />
      <span>{text}</span>
    </p>
  );
}

function StatusDot({ tone }: { tone: StatusTone }) {
  const palette = tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-red-500";
  return <span aria-hidden className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${palette}`} />;
}

function SectionCard({ section }: { section: SubmissionSection }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/75 px-5 py-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{section.title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {section.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReferralFlagRow({ flag }: { flag: ReferralFlag }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <StatusDot tone={flag.severity} />
        <div>
          <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${toneClasses(flag.severity)}`}>
            {flag.code.replaceAll("_", " ")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{flag.message}</p>
        </div>
      </div>
    </div>
  );
}

function InformationGapRow({ gap }: { gap: InformationGap }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">{gap.label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{gap.impact}</p>
      <p className="mt-2 text-sm leading-6 text-amber-700">{gap.action}</p>
    </div>
  );
}

import type {
  StakeholderCommsInsight,
  StakeholderCommsInput,
  StakeholderCommsPersisted
} from "@/types/stakeholder-comms";

const REQUIRED_FIELDS = ["comms_type", "audience", "tone", "subject", "context", "message_1", "action_1"] as const;

type ParsedMap = Record<string, string>;

function parseInput(text: string): ParsedMap {
  const parsed: ParsedMap = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) parsed[key] = value;
  }
  return parsed;
}

function confidence(completeness: number): "high" | "medium" | "low" {
  if (completeness >= 95) return "high";
  if (completeness >= 70) return "medium";
  return "low";
}

function status(completeness: number, warnings: string[]): "ready" | "needs-review" | "blocked" {
  if (completeness < 70) return "blocked";
  if (warnings.length > 0) return "needs-review";
  return "ready";
}

export function analyzeStakeholderComms(input: StakeholderCommsInput): {
  analysis: StakeholderCommsInsight;
  persisted: StakeholderCommsPersisted;
} {
  const parsed = parseInput(input.commsText);

  const fields = REQUIRED_FIELDS.map((field) => {
    const value = parsed[field] ?? "";
    return {
      field,
      value: value || "-",
      status: value ? "extracted" : "missing"
    } as const;
  });

  const extracted = fields.filter((f) => f.status === "extracted").length;
  const completenessPct = Math.round((extracted / REQUIRED_FIELDS.length) * 100);

  const keyMessages = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("message_") && value)
    .map(([, value]) => value)
    .slice(0, 5);

  const actions = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith("action_") && value)
    .map(([, value]) => value)
    .slice(0, 5);

  const warnings: string[] = [];
  if (keyMessages.length < 2) warnings.push("Fewer than two key messages provided.");
  if (actions.length < 1) warnings.push("No explicit action owner/task captured.");
  if ((parsed.tone || "").toLowerCase().includes("informal")) {
    warnings.push("Informal tone may be unsuitable for executive communication.");
  }

  const promptTokens = (input.prompt || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  const corpus = [parsed.context, ...keyMessages, ...actions].join(" ").toLowerCase();
  const promptHits = Array.from(new Set(promptTokens.filter((token) => corpus.includes(token)))).slice(0, 8);

  const commsType = parsed.comms_type || "Unknown";
  const audience = parsed.audience || "Unknown";
  const tone = parsed.tone || "Unspecified";
  const subject = parsed.subject || "Unspecified";

  const draft = [
    `Subject: ${subject}`,
    `Audience: ${audience}`,
    `${commsType} — ${parsed.context || "Context pending validation."}`,
    keyMessages.length ? `Key points: ${keyMessages.join(" ")}` : "Key points: Pending.",
    actions.length ? `Actions: ${actions.join(" ")}` : "Actions: Pending assignment."
  ].join("\n\n");

  const conf = confidence(completenessPct);
  const state = status(completenessPct, warnings);

  const analysis: StakeholderCommsInsight = {
    summary: {
      completenessPct,
      confidence: conf,
      status: state,
      audience,
      commsType
    },
    fields,
    keyMessages,
    actions,
    draft,
    promptHits,
    warnings
  };

  return {
    analysis,
    persisted: {
      sourceLabel: input.sourceLabel || "manual-entry.txt",
      commsType,
      audience,
      tone,
      subject,
      status: state,
      completenessPct,
      confidence: conf,
      keyMessages,
      actions,
      draft,
      promptHits,
      warnings
    }
  };
}

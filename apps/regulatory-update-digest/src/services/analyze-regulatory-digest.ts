import type { RegulatoryDigestInsight, RegulatoryUpdate, Severity } from "@/types/regulatory-digest";

interface ParsedUpdateSeed {
  source: string;
  title: string;
  publishedOn: string;
  classes: string[];
  update: string;
  action: string;
}

const urgentTokens = ["must", "required", "deadline", "immediate", "sanctions", "prohibit", "capital", "breach"];
const watchTokens = ["consultation", "proposal", "draft", "should", "expectation", "guidance"];

function tokeniseQuestion(question: string | undefined): string[] {
  return (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function parseClasses(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFeed(feedText: string): ParsedUpdateSeed[] {
  return feedText
    .split(/\n-{3,}\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      const getValue = (prefix: string) => {
        const line = lines.find((candidate) => candidate.toLowerCase().startsWith(prefix.toLowerCase()));
        return line ? line.slice(prefix.length).trim() : "";
      };

      return {
        source: getValue("SOURCE:"),
        title: getValue("TITLE:"),
        publishedOn: getValue("DATE:"),
        classes: parseClasses(getValue("CLASS:")),
        update: getValue("UPDATE:"),
        action: getValue("ACTION:")
      } satisfies ParsedUpdateSeed;
    });
}

function classifySeverity(seed: ParsedUpdateSeed, relevanceScore: number): Severity {
  const text = `${seed.title} ${seed.update} ${seed.action}`.toLowerCase();
  const urgent = urgentTokens.some((token) => text.includes(token));
  const consultative = watchTokens.some((token) => text.includes(token));

  if (urgent || relevanceScore >= 80) {
    return "high";
  }

  if (consultative || relevanceScore >= 55) {
    return "medium";
  }

  return "low";
}

function deriveTags(seed: ParsedUpdateSeed, severity: Severity): string[] {
  const tags = new Set<string>();
  const text = `${seed.title} ${seed.update} ${seed.action}`.toLowerCase();

  if (text.includes("sanction")) tags.add("sanctions");
  if (text.includes("conduct") || text.includes("customer")) tags.add("conduct");
  if (text.includes("deadline") || text.includes("required") || text.includes("must")) tags.add("deadline_control");
  if (text.includes("claims")) tags.add("claims");
  if (text.includes("governance")) tags.add("governance");
  if (text.includes("resilience")) tags.add("resilience");

  tags.add(`severity_${severity}`);
  return Array.from(tags);
}

function computeRelevance(seed: ParsedUpdateSeed, classFocus: string[]): number {
  const updateText = `${seed.title} ${seed.update} ${seed.action}`.toLowerCase();
  const classMatch = seed.classes.some((entry) =>
    classFocus.some((focus) => entry.toLowerCase().includes(focus.toLowerCase()))
  );

  let score = classMatch ? 55 : 25;

  if (urgentTokens.some((token) => updateText.includes(token))) {
    score += 25;
  }

  if (watchTokens.some((token) => updateText.includes(token))) {
    score += 10;
  }

  if (seed.action.length >= 40) {
    score += 8;
  }

  return Math.min(100, score);
}

export function analyzeRegulatoryDigest(
  feedText: string,
  classFocusRaw: string,
  question?: string
): RegulatoryDigestInsight {
  const parsed = parseFeed(feedText);
  const classFocus = parseClasses(classFocusRaw);

  const updates: RegulatoryUpdate[] = parsed.map((seed, index) => {
    const relevanceScore = computeRelevance(seed, classFocus);
    const severity = classifySeverity(seed, relevanceScore);

    return {
      id: `update-${index + 1}`,
      source: seed.source,
      title: seed.title,
      publishedOn: seed.publishedOn,
      classes: seed.classes,
      update: seed.update,
      action: seed.action,
      severity,
      relevanceScore,
      tags: deriveTags(seed, severity)
    };
  });

  const relevant = updates.filter((item) => item.relevanceScore >= 55);
  const highSeverity = updates.filter((item) => item.severity === "high");

  const warnings: string[] = [];
  if (parsed.length < 2) {
    warnings.push("Minimum two regulatory updates are required for comparative digesting.");
  }

  const missingFieldCount = parsed.filter(
    (item) =>
      !item.source || !item.title || !item.publishedOn || item.classes.length === 0 || !item.update || !item.action
  ).length;

  if (missingFieldCount > 0) {
    warnings.push(`${missingFieldCount} bulletin entries are missing required fields (source/title/date/class/update/action).`);
  }

  if (classFocus.length === 0) {
    warnings.push("Class focus is empty; relevance scoring defaults to generic weighting.");
  }

  const priorityAlerts = updates
    .filter((item) => item.severity === "high" || item.relevanceScore >= 75)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 4)
    .map((item) => `${item.title} (${item.source}) - ${item.severity.toUpperCase()} priority, relevance ${item.relevanceScore}.`);

  const actions = updates
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6)
    .map((item) => `${item.action} [${item.source} | ${item.publishedOn}]`);

  const sourceCoverage = Array.from(new Set(updates.map((item) => item.source).filter(Boolean)));

  const queryTokens = tokeniseQuestion(question);
  const queryHits = queryTokens.length
    ? feedText
        .split(/\n+/)
        .filter((line) => queryTokens.some((token) => line.toLowerCase().includes(token)))
        .slice(0, 5)
    : [];

  const whitespaceRows: RegulatoryDigestInsight["whitespaceRows"] = [
    {
      fieldWording: "Bulletin count",
      extractedValue: String(updates.length),
      status: updates.length > 0 ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Class focus",
      extractedValue: classFocus.join(", "),
      status: classFocus.length > 0 ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "High severity count",
      extractedValue: String(highSeverity.length),
      status: "EXTRACTED"
    },
    {
      fieldWording: "Primary source coverage",
      extractedValue: sourceCoverage.join(", "),
      status: sourceCoverage.length > 0 ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Priority alerts",
      extractedValue: priorityAlerts.length > 0 ? priorityAlerts.join(" | ") : "",
      status: priorityAlerts.length > 0 ? "EXTRACTED" : "MISSING"
    }
  ];

  return {
    summary: {
      bulletinCount: updates.length,
      relevantCount: relevant.length,
      highSeverityCount: highSeverity.length,
      sourceCoverage,
      classFocus
    },
    executiveBrief: [
      `${relevant.length} of ${updates.length} updates are materially relevant to selected classes.`,
      highSeverity.length > 0
        ? `${highSeverity.length} updates are high severity and need immediate governance ownership.`
        : "No high severity updates detected; continue routine monitoring.",
      sourceCoverage.length > 0
        ? `Coverage spans ${sourceCoverage.join(", ")}.`
        : "No valid source metadata detected in feed."
    ],
    priorityAlerts,
    actions,
    updates,
    warnings,
    queryHits,
    whitespaceRows
  };
}

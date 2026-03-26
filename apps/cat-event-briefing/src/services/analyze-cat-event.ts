import type { CatClassImpact, CatEventInsight, CatHeatPoint, CatWarning } from "@/types/cat-event-briefing";

const perilRules = [
  { peril: "Windstorm", tokens: ["hurricane", "cyclone", "typhoon", "windstorm", "storm surge", "gale"] },
  { peril: "Flood", tokens: ["flood", "flash flood", "river overflow", "inundation"] },
  { peril: "Earthquake", tokens: ["earthquake", "seismic", "aftershock", "richter"] },
  { peril: "Wildfire", tokens: ["wildfire", "bushfire", "forest fire", "evacuation zone"] },
  { peril: "Convective Storm", tokens: ["hail", "tornado", "thunderstorm", "derecho"] }
] as const;

const regionTokens = [
  "united kingdom",
  "france",
  "germany",
  "austria",
  "czech republic",
  "netherlands",
  "spain",
  "italy",
  "united states",
  "canada",
  "mexico",
  "japan",
  "australia",
  "new zealand",
  "caribbean",
  "europe",
  "north america",
  "southeast asia",
  "middle east"
] as const;

const regionCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "United Kingdom": { latitude: 54.5, longitude: -2.5 },
  France: { latitude: 46.2, longitude: 2.2 },
  Germany: { latitude: 51.1, longitude: 10.4 },
  Austria: { latitude: 47.5, longitude: 14.5 },
  "Czech Republic": { latitude: 49.8, longitude: 15.5 },
  Netherlands: { latitude: 52.1, longitude: 5.3 },
  Spain: { latitude: 40.4, longitude: -3.7 },
  Italy: { latitude: 42.8, longitude: 12.5 },
  "United States": { latitude: 39.8, longitude: -98.6 },
  Canada: { latitude: 56.1, longitude: -106.3 },
  Mexico: { latitude: 23.6, longitude: -102.5 },
  Japan: { latitude: 36.2, longitude: 138.2 },
  Australia: { latitude: -25.3, longitude: 133.8 },
  "New Zealand": { latitude: -40.9, longitude: 174.9 },
  Caribbean: { latitude: 18.2, longitude: -66.4 },
  Europe: { latitude: 54, longitude: 15 },
  "North America": { latitude: 44, longitude: -100 },
  "Southeast Asia": { latitude: 10.8, longitude: 106.7 },
  "Middle East": { latitude: 25.2, longitude: 55.3 }
};

const classRules: Record<string, CatClassImpact[]> = {
  Windstorm: [
    { className: "Property", priority: "high", rationale: "Structural and roof damage exposure is expected to be primary." },
    { className: "Business Interruption", priority: "high", rationale: "Utilities disruption and access constraints may drive BI losses." },
    { className: "Marine Cargo", priority: "medium", rationale: "Port and transit delays can cause contingent cargo loss and spoilage." },
    { className: "Energy", priority: "monitor", rationale: "Grid and generation assets may experience wind-related outages." }
  ],
  Flood: [
    { className: "Property", priority: "high", rationale: "Water ingress and prolonged drying periods increase indemnity severity." },
    { className: "Business Interruption", priority: "high", rationale: "Extended shutdown windows are likely in affected zones." },
    { className: "Construction", priority: "medium", rationale: "Open-site works and delayed completions increase risk." },
    { className: "Motor Fleet", priority: "monitor", rationale: "Accumulated fleet damage may emerge in pooled parking locations." }
  ],
  Earthquake: [
    { className: "Property", priority: "high", rationale: "Potential for large structural loss and ordinance implications." },
    { className: "Engineering", priority: "high", rationale: "Machinery and critical infrastructure may sustain latent damage." },
    { className: "Casualty", priority: "medium", rationale: "Third-party liability from building failures can escalate." },
    { className: "Marine Cargo", priority: "monitor", rationale: "Supply chain interruptions may affect cargo throughput." }
  ],
  Wildfire: [
    { className: "Property", priority: "high", rationale: "Direct burn and smoke damage can drive large loss frequency." },
    { className: "Business Interruption", priority: "high", rationale: "Evacuation and civil authority shutdowns increase BI pressure." },
    { className: "Agriculture", priority: "medium", rationale: "Crop and livestock exposure can increase in burn corridors." },
    { className: "Liability", priority: "monitor", rationale: "Potential third-party liability from fire spread and smoke impacts." }
  ],
  "Convective Storm": [
    { className: "Property", priority: "high", rationale: "Hail and wind events usually produce concentrated property claims." },
    { className: "Motor", priority: "medium", rationale: "Vehicle hail losses may rise quickly in urban accumulation zones." },
    { className: "Agriculture", priority: "medium", rationale: "Crop and greenhouse assets are sensitive to severe hail." },
    { className: "Construction", priority: "monitor", rationale: "Site vulnerabilities and scaffolding exposures may worsen." }
  ],
  MultiPeril: [
    { className: "Property", priority: "high", rationale: "Multi-peril sequences create compounding property severity." },
    { className: "Business Interruption", priority: "high", rationale: "Recovery timelines are typically extended under cascading events." },
    { className: "Contingent Business Interruption", priority: "medium", rationale: "Supply-chain dependencies are stressed in multi-region events." },
    { className: "Casualty", priority: "monitor", rationale: "Post-event liability notifications can emerge with reporting lag." }
  ]
};

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function detectPerils(text: string): string[] {
  const lower = text.toLowerCase();
  return perilRules.filter((rule) => rule.tokens.some((token) => lower.includes(token))).map((rule) => rule.peril);
}

function detectRegions(text: string): string[] {
  const lower = text.toLowerCase();
  return regionTokens.filter((token) => lower.includes(token)).map((token) => token.replace(/\b\w/g, (m) => m.toUpperCase()));
}

function detectSeverity(text: string): number {
  const lower = text.toLowerCase();
  let score = 2;

  if (/(catastrophic|extreme|historic|widespread destruction)/.test(lower)) {
    score += 2;
  }
  if (/(major|severe|material losses|state of emergency)/.test(lower)) {
    score += 1;
  }
  if (/(fatalit|evacuat|infrastructure outage|airport closure|port closure)/.test(lower)) {
    score += 1;
  }
  if (/(minor|contained|limited impact)/.test(lower)) {
    score -= 1;
  }

  return Math.min(5, Math.max(1, score));
}

function detectEventDate(text: string): string | null {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return iso ? iso[1] : null;
}

function severityLabel(score: number): string {
  if (score >= 5) return "Critical";
  if (score === 4) return "High";
  if (score === 3) return "Elevated";
  if (score === 2) return "Guarded";
  return "Low";
}

function estimateLossBand(perils: string[], score: number): string {
  const topPeril = perils[0] ?? "Windstorm";
  const baseByPeril: Record<string, number> = {
    Windstorm: 30,
    Flood: 25,
    Earthquake: 40,
    Wildfire: 22,
    "Convective Storm": 18,
    MultiPeril: 45
  };

  const base = baseByPeril[topPeril] ?? 20;
  const lower = base * score;
  const upper = Math.round(lower * 1.8);
  return `GBP ${lower}m - GBP ${upper}m (initial deterministic band)`;
}

function buildWarnings(score: number, regions: string[], perils: string[]): CatWarning[] {
  const warnings: CatWarning[] = [];

  if (score >= 4) {
    warnings.push({
      code: "high_severity",
      message: "Severity is high/critical. Trigger senior underwriting and claims referral immediately."
    });
  }

  if (regions.length >= 3 || perils.length >= 2) {
    warnings.push({
      code: "cross_region_accumulation",
      message: "Cross-region or multi-peril indicators detected. Review accumulation and aggregate limits."
    });
  }

  if (regions.length === 0 || perils.length === 0) {
    warnings.push({
      code: "data_uncertain",
      message: "Region or peril signals are sparse; request a verified market event bulletin before placement decisions."
    });
  }

  return warnings;
}

function buildQueryHits(text: string, question?: string | null): string[] {
  if (!question?.trim()) {
    return [];
  }

  const tokens = question
    .toLowerCase()
    .split(/\W+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (tokens.length === 0) {
    return [];
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => compact(sentence))
    .filter(Boolean)
    .filter((sentence) => tokens.some((token) => sentence.toLowerCase().includes(token)))
    .slice(0, 5);
}

function buildHeatPoints(regions: string[], severityScore: number): CatHeatPoint[] {
  const resolved = regions
    .map((region) => {
      const coords = regionCoordinates[region];
      if (!coords) {
        return null;
      }

      return {
        label: region,
        latitude: coords.latitude,
        longitude: coords.longitude
      };
    })
    .filter((item): item is { label: string; latitude: number; longitude: number } => item !== null);

  if (resolved.length === 0) {
    return [
      {
        label: "Global event center",
        latitude: 51.5,
        longitude: -0.12,
        intensity: Math.min(1, Math.max(0.35, severityScore / 5)),
        weight: 1
      }
    ];
  }

  const maxWeight = resolved.length;
  return resolved.map((item, index) => {
    const weight = maxWeight - index;
    const severityBoost = severityScore / 5;
    const normalized = weight / maxWeight;
    const intensity = Number(Math.min(1, Math.max(0.2, normalized * 0.65 + severityBoost * 0.35)).toFixed(3));

    return {
      ...item,
      weight,
      intensity
    };
  });
}

export function analyzeCatEventText(eventText: string, question?: string | null): CatEventInsight {
  const normalized = compact(eventText);
  const foundPerils = detectPerils(normalized);
  const perils = foundPerils.length >= 2 ? ["MultiPeril", ...foundPerils] : foundPerils;
  const regions = detectRegions(normalized);
  const score = detectSeverity(normalized);
  const selectedPeril = perils[0] ?? "Windstorm";
  const impacts = (classRules[selectedPeril] ?? classRules.Windstorm).slice(0, 4);
  const warnings = buildWarnings(score, regions, perils);
  const date = detectEventDate(normalized);

  const summary = {
    peril: selectedPeril,
    severityScore: score,
    severityLabel: severityLabel(score),
    eventDate: date,
    regionCount: regions.length,
    affectedClassesCount: impacts.length,
    estimatedLossBand: estimateLossBand(perils, score)
  };

  const regionLabel = regions.length > 0 ? regions.join(", ") : "reported regions not yet confirmed";
  const highPriorityClasses = impacts.filter((item) => item.priority === "high").map((item) => item.className);
  const severeWarningCount = warnings.filter((w) => /severe|critical|escalate|urgent/i.test(w.message)).length;
  const suggestedActions = [
    `Issue underwriting bulletin for ${selectedPeril} across ${regionLabel} with severity score ${score} (${summary.severityLabel.toLowerCase()}).`,
    `Run accumulation sweep on priority classes: ${(highPriorityClasses.length ? highPriorityClasses : impacts.map((i) => i.className).slice(0, 3)).join(", ")}.`,
    `Activate claims/FNOL surge readiness for ${regions.length || 1} territory cluster(s) with ${warnings.length} warning trigger(s).`,
    `Set review checkpoint at ${date ?? "T+24h"} and refresh loss band ${summary.estimatedLossBand}; current severe warning count ${severeWarningCount}.`
  ];

  return {
    summary,
    affectedClasses: impacts,
    warnings,
    heatPoints: buildHeatPoints(regions, score),
    queryHits: buildQueryHits(normalized, question),
    briefing: {
      eventHeadline: `${selectedPeril} event briefing (${summary.severityLabel} severity)`,
      facts: [
        `Detected peril profile: ${perils.join(", ") || "unclassified"}.`,
        `Detected regions: ${regionLabel}.`,
        `Event date reference: ${date ?? "not explicitly stated"}.`
      ],
      impacts: [
        `Initial loss band: ${summary.estimatedLossBand}.`,
        `Priority classes: ${impacts
          .filter((item) => item.priority === "high")
          .map((item) => item.className)
          .join(", ") || "Property"}.`,
        `Expected monitoring intensity: ${summary.severityLabel.toLowerCase()} with ${warnings.length} warning trigger(s).`
      ],
      suggestedActions
    }
  };
}

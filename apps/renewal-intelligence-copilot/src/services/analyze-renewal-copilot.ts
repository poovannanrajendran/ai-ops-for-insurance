import type {
  PricingSignal,
  RenewalCopilotInsight,
  RenewalStrategyRecommendation,
  Severity
} from "@/types/renewal-copilot";

const requiredFields = [
  "INSURED",
  "CLASS",
  "CURRENT PREMIUM GBP",
  "LOSS RATIO PCT",
  "CLAIMS TREND",
  "EXPOSURE CHANGE PCT",
  "RISK CONTROLS",
  "MARKET CONDITIONS",
  "TARGET EFFECTIVE DATE",
  "BROKER OBJECTIVE"
] as const;

function parseKeyValue(text: string): Record<string, string> {
  return Object.fromEntries(
    text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key?.trim().toUpperCase() ?? "", rest.join(":").trim()];
      })
      .filter(([key]) => key.length > 0)
  );
}

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeTechnicalRateAdequacy(lossRatio: number): number {
  if (lossRatio === 0) return 0;
  return Math.round(((65 - lossRatio) / 65) * 100);
}

function severityFromDriver(driver: string): Severity {
  const lower = driver.toLowerCase();
  if (/loss ratio|frequency increase|tightening|incomplete|delay|high-severity|theft|sanctions/.test(lower)) return "high";
  if (/exposure|capacity caution|deductible appetite|monitor/.test(lower)) return "medium";
  return "low";
}

function tokenizeQuestion(question: string | undefined): string[] {
  return (question ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function deriveRenewalStrategy(
  lossRatio: number,
  totalImpact: number,
  highRiskDrivers: number,
  renewalText: string,
  eml: number,
  limit: number
): RenewalStrategyRecommendation {
  const lowerText = renewalText.toLowerCase();
  if (lossRatio >= 100 || lowerText.includes("sanctions") || lowerText.includes("fraud")) {
    return {
      strategy: "decline_renewal",
      rationale: "Account is technically non-viable or carries compliance exposure that cannot be priced."
    };
  }
  if (lossRatio >= 80 || highRiskDrivers >= 3 || (eml >= limit * 0.8 && eml > 0 && limit > 0)) {
    return {
      strategy: "refer_to_senior",
      rationale:
        "Loss ratio or risk accumulation exceeds standard underwriting authority. Senior sign-off required before terms are offered."
    };
  }
  if (totalImpact >= 5) {
    return {
      strategy: "rate_increase_required",
      rationale: `Technical analysis indicates rate inadequacy. Movement of +${totalImpact}% is required to restore adequacy before renewal can be confirmed.`
    };
  }
  return {
    strategy: "renew_flat",
    rationale:
      "Account is within technical parameters. Flat renewal is supportable subject to controls confirmation and standard documentation."
  };
}

export function analyzeRenewalCopilot(renewalText: string, question?: string): {
  missing: string[];
  insight: RenewalCopilotInsight;
} {
  const parsed = parseKeyValue(renewalText);
  const missing = requiredFields.filter((field) => !parsed[field]);

  const lossRatio = toNumber(parsed["LOSS RATIO PCT"]);
  const exposureChange = toNumber(parsed["EXPOSURE CHANGE PCT"]);
  const tra = computeTechnicalRateAdequacy(lossRatio);
  const marketConditions = (parsed["MARKET CONDITIONS"] ?? "").toLowerCase();
  const claimsTrend = parsed["CLAIMS TREND"] ?? "";
  const riskControls = parsed["RISK CONTROLS"] ?? "";
  const deductible = parsed["DEDUCTIBLE GBP"] ?? "";
  const eml = toNumber(parsed["EML GBP"]);
  const limit = toNumber(parsed["LIMIT GBP"]);
  const hasLta = Boolean((parsed["LTA"] ?? "").trim());

  const pricingSignals: PricingSignal[] = [
    {
      driver: `Loss ratio ${lossRatio}% vs 65% technical benchmark`,
      direction: lossRatio >= 75 ? "increase" : lossRatio <= 45 ? "decrease" : "hold",
      impactPct: lossRatio >= 75 ? Math.min(Math.round((lossRatio - 65) / 5), 20) : lossRatio <= 45 ? -5 : 2,
      severity: lossRatio >= 75 ? "high" : lossRatio >= 60 ? "medium" : "low"
    },
    {
      driver: `Exposure movement ${exposureChange}%`,
      direction: exposureChange >= 10 ? "increase" : exposureChange <= -5 ? "decrease" : "hold",
      impactPct: exposureChange >= 10 ? Math.min(Math.round(exposureChange * 0.5), 10) : exposureChange <= -5 ? -3 : 1,
      severity: exposureChange >= 15 ? "high" : exposureChange >= 8 ? "medium" : "low"
    },
    {
      driver: `Market: ${parsed["MARKET CONDITIONS"] || "unknown"}`,
      direction: /tightening|harden|restrict/.test(marketConditions)
        ? "increase"
        : /soft|available|ample/.test(marketConditions)
          ? "decrease"
          : "hold",
      impactPct: /tightening|harden|restrict/.test(marketConditions) ? 5 : /soft|available|ample/.test(marketConditions) ? -3 : 0,
      severity: /tightening|harden/.test(marketConditions) ? "medium" : "low"
    },
    {
      driver: `Controls: ${riskControls.slice(0, 60) || "not stated"}`,
      direction: /incomplete|delay|weak|absent|outstanding/.test(riskControls.toLowerCase())
        ? "increase"
        : /strong|complete|certified|accredited/.test(riskControls.toLowerCase())
          ? "decrease"
          : "hold",
      impactPct: /incomplete|delay|weak|absent|outstanding/.test(riskControls.toLowerCase())
        ? 5
        : /strong|complete|certified|accredited/.test(riskControls.toLowerCase())
          ? -3
          : 0,
      severity: severityFromDriver(riskControls)
    },
    {
      driver: `Claims trend: ${claimsTrend.slice(0, 60) || "not stated"}`,
      direction: /frequency increase|multiple|recurring|cluster/.test(claimsTrend.toLowerCase()) ? "increase" : "hold",
      impactPct: /frequency increase|multiple|recurring|cluster/.test(claimsTrend.toLowerCase())
        ? 6
        : /nil|no claims/.test(claimsTrend.toLowerCase())
          ? -2
          : 1,
      severity: /frequency increase|multiple|high-severity/.test(claimsTrend.toLowerCase())
        ? "high"
        : /single|stable/.test(claimsTrend.toLowerCase())
          ? "low"
          : "medium"
    },
    {
      driver: deductible ? `Deductible at GBP ${deductible}` : "Deductible not stated",
      direction: /low|reduce|below market/.test(deductible.toLowerCase()) ? "increase" : "hold",
      impactPct: deductible ? 0 : 3,
      severity: deductible ? "low" : "medium"
    },
    {
      driver:
        eml && limit
          ? `EML GBP ${eml.toLocaleString()} vs limit GBP ${limit.toLocaleString()}`
          : "EML or limit not stated",
      direction: eml && limit && eml >= limit * 0.8 ? "increase" : "hold",
      impactPct: eml && limit && eml >= limit * 0.8 ? 7 : eml && limit ? 0 : 2,
      severity: eml && limit && eml >= limit * 0.8 ? "high" : eml && limit ? "low" : "medium"
    }
  ];

  const weighted =
    pricingSignals[0].impactPct * 0.3 +
    pricingSignals[4].impactPct * 0.2 +
    pricingSignals[1].impactPct * 0.15 +
    pricingSignals[3].impactPct * 0.15 +
    pricingSignals[2].impactPct * 0.1 +
    pricingSignals[5].impactPct * 0.05 +
    pricingSignals[6].impactPct * 0.05;

  const totalImpact = Math.round(weighted);
  const pricingDirection: "increase" | "decrease" | "hold" =
    totalImpact >= 5 ? "increase" : totalImpact <= -3 ? "decrease" : "hold";

  const highRiskDrivers = pricingSignals.filter((signal) => signal.severity === "high").length;
  const renewalStrategyRec = deriveRenewalStrategy(lossRatio, totalImpact, highRiskDrivers, renewalText, eml, limit);
  const ltaText = hasLta
    ? "Account is on LTA — movement constraints apply; confirm LTA terms before tabling any increase above agreed band."
    : "No LTA flagged — standard market negotiation applies without structural movement constraints.";

  const actionPlan = [
    `Confirm pricing corridor: ${pricingDirection} direction with target movement ${totalImpact >= 0 ? "+" : ""}${totalImpact}%.`,
    `Obtain signed loss narrative and adjuster report for claims trend: ${claimsTrend || "not provided"}.`,
    `Request updated controls evidence — ${riskControls || "not stated"}. Make remediation completion a renewal condition if outstanding.`,
    `Validate EML against current limit — ${
      eml && limit
        ? `EML GBP ${eml.toLocaleString()} vs limit GBP ${limit.toLocaleString()}`
        : "EML or limit not provided — obtain survey confirmation before binding"
    }.`,
    `Confirm deductible adequacy — ${
      deductible ? `current GBP ${deductible} — benchmark against peer accounts` : "deductible not stated — request and benchmark"
    }.`,
    hasLta
      ? `LTA in place — review LTA band before tabling movement. LTA: ${parsed["LTA"]}`
      : "No LTA — confirm broker position on multi-year terms if account is strategically important.",
    `Target effective date: ${parsed["TARGET EFFECTIVE DATE"] || "not stated"} — confirm authority sign-off window and align documentation deadline.`
  ];

  const warnings: string[] = [];
  if (missing.length > 0) warnings.push(`Missing required renewal fields: ${missing.join(", ")}.`);
  if (lossRatio >= 80) warnings.push("Loss ratio is above 80%, escalate pricing and terms review.");
  if (/incomplete|delay|weak/.test(riskControls.toLowerCase())) {
    warnings.push("Risk control evidence is weak/incomplete, include remediation commitments in renewal strategy.");
  }

  const queryTokens = tokenizeQuestion(question);
  const queryHits = queryTokens.length
    ? renewalText
        .split(/\n+/)
        .filter((line) => queryTokens.some((token) => line.toLowerCase().includes(token)))
        .slice(0, 5)
    : [];

  const whitespaceRows: RenewalCopilotInsight["whitespaceRows"] = [
    { fieldWording: "Insured", extractedValue: parsed["INSURED"] ?? "", status: parsed["INSURED"] ? "EXTRACTED" : "MISSING" },
    {
      fieldWording: "Class / line of business",
      extractedValue: parsed["CLASS"] ?? "",
      status: parsed["CLASS"] ? "EXTRACTED" : "MISSING"
    },
    { fieldWording: "Broker", extractedValue: parsed["BROKER"] ?? "", status: parsed["BROKER"] ? "EXTRACTED" : "MISSING" },
    {
      fieldWording: "Policy period",
      extractedValue: parsed["POLICY PERIOD"] ?? "",
      status: parsed["POLICY PERIOD"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Current premium (GBP)",
      extractedValue: parsed["CURRENT PREMIUM GBP"] ?? "",
      status: parsed["CURRENT PREMIUM GBP"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Prior year premium (GBP)",
      extractedValue: parsed["PRIOR YEAR PREMIUM GBP"] ?? "",
      status: parsed["PRIOR YEAR PREMIUM GBP"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Loss ratio (%)",
      extractedValue: parsed["LOSS RATIO PCT"] ?? "",
      status: parsed["LOSS RATIO PCT"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Insured value (GBP)",
      extractedValue: parsed["INSURED VALUE GBP"] ?? "",
      status: parsed["INSURED VALUE GBP"] ? "EXTRACTED" : "MISSING"
    },
    {
      fieldWording: "Limit (GBP)",
      extractedValue: parsed["LIMIT GBP"] ?? "",
      status: parsed["LIMIT GBP"] ? "EXTRACTED" : "MISSING"
    },
    { fieldWording: "EML (GBP)", extractedValue: parsed["EML GBP"] ?? "", status: parsed["EML GBP"] ? "EXTRACTED" : "MISSING" },
    {
      fieldWording: "Deductible (GBP)",
      extractedValue: parsed["DEDUCTIBLE GBP"] ?? "",
      status: parsed["DEDUCTIBLE GBP"] ? "EXTRACTED" : "MISSING"
    },
    { fieldWording: "LTA", extractedValue: parsed["LTA"] ?? "", status: parsed["LTA"] ? "EXTRACTED" : "MISSING" }
  ];

  const strategyMemo = [
    `Recommended pricing direction: ${pricingDirection} (${totalImpact >= 0 ? "+" : ""}${totalImpact}%).`,
    `Technical rate adequacy: ${tra >= 0 ? "+" : ""}${tra}% vs target (${tra >= 0 ? "over-rated — room to hold or reduce" : "under-rated — increase required"}).`,
    `Loss ratio ${lossRatio}% — ${lossRatio >= 80 ? "above referral threshold of 80%" : lossRatio >= 65 ? "above target but within tolerance" : "within acceptable range"}.`,
    `Risk drivers: ${highRiskDrivers} high-severity signals identified across loss, exposure, and controls.`,
    `Renewal strategy: ${renewalStrategyRec.strategy.replace(/_/g, " ")} — ${renewalStrategyRec.rationale}`,
    `Open actions before authority sign-off: ${actionPlan.length}.`
  ];

  const negotiationTalkingPoints = [
    `Anchor on technical rate adequacy: current position is ${tra >= 0 ? "+" : ""}${tra}% — use this to defend the ${pricingDirection} position.`,
    `Reference the ${lossRatio}% loss ratio directly and compare to the market benchmark of 65% target combined ratio.`,
    "If broker pushes back on rate, offer deductible adjustment as an alternative lever — confirm deductible appetite before the meeting.",
    `Tie any capacity commitment to evidence of controls completion — ${
      /incomplete|delay|weak/.test(riskControls.toLowerCase())
        ? "already flagged, make remediation a condition"
        : "has not been flagged — request confirmation proactively"
    }.`,
    `Frame exposure change of ${exposureChange}% as a natural basis for premium adjustment independent of rate movement.`,
    ltaText
  ];

  return {
    missing: [...missing],
    insight: {
      summary: {
        pricingDirection,
        recommendedMovementPct: totalImpact,
        highRiskDrivers,
        openActions: actionPlan.length,
        technicalRateAdequacyPct: tra
      },
      strategyMemo,
      negotiationTalkingPoints,
      pricingSignals,
      actionPlan,
      renewalStrategy: renewalStrategyRec,
      warnings,
      queryHits,
      whitespaceRows
    }
  };
}

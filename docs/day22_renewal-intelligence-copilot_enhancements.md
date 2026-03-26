# Day 22 — Renewal Intelligence Copilot: Domain Depth Enhancement

## Context

App: `apps/renewal-intelligence-copilot`
Short name: `renewalcopilot`
Port: `3022`
Issue: The current pricing signal logic, strategy memo, negotiation points, and demo samples lack London Market renewal underwriting depth. Signal impacts are hardcoded flat values, the memo is three generic lines, and the samples are missing key financial fields underwriters actually use at renewal.

---

## 1. Service layer — `src/services/analyze-renewal-copilot.ts`

### 1a. Add optional field parsing constants

Add to the top of the file:

```ts
const optionalFields = [
  "PRIOR YEAR PREMIUM GBP",
  "LIMIT GBP",
  "DEDUCTIBLE GBP",
  "INSURED VALUE GBP",
  "EML GBP",
  "BROKER",
  "POLICY PERIOD",
  "LTA"
] as const;
```

These are not validation-gated but must appear in the whitespace table.

---

### 1b. Add `computeTechnicalRateAdequacy` function

Technical rate adequacy (TRA) is the core renewal underwriting metric. It answers: "Is the current premium enough to cover expected losses at the target combined ratio?"

```ts
// target loss ratio assumed at 65% (standard London Market property/liability benchmark)
function computeTechnicalRateAdequacy(lossRatio: number): number {
  if (lossRatio === 0) return 0;
  // positive = over-rated (room to reduce), negative = under-rated (increase required)
  return Math.round(((65 - lossRatio) / 65) * 100);
}
```

Return this as `summary.technicalRateAdequacyPct`.

---

### 1c. Expand pricing signals from 4 to 7

Replace the current 4-signal array with these 7 deterministic signals. Each `impactPct` must be derived from parsed values, not hardcoded constants.

**Signal 1 — Loss ratio adequacy**
```
driver: `Loss ratio ${lossRatio}% vs 65% technical benchmark`
direction: lossRatio >= 75 ? "increase" : lossRatio <= 45 ? "decrease" : "hold"
impactPct: lossRatio >= 75 ? Math.min(Math.round((lossRatio - 65) / 5), 20) : lossRatio <= 45 ? -5 : 2
severity: lossRatio >= 75 ? "high" : lossRatio >= 60 ? "medium" : "low"
```

**Signal 2 — Exposure change**
```
driver: `Exposure movement ${exposureChange}%`
direction: exposureChange >= 10 ? "increase" : exposureChange <= -5 ? "decrease" : "hold"
impactPct: exposureChange >= 10 ? Math.min(Math.round(exposureChange * 0.5), 10) : exposureChange <= -5 ? -3 : 1
severity: exposureChange >= 15 ? "high" : exposureChange >= 8 ? "medium" : "low"
```

**Signal 3 — Market conditions**
```
driver: `Market: ${parsed["MARKET CONDITIONS"] || "unknown"}`
direction: /tightening|harden|restrict/.test(marketConditions) ? "increase" : /soft|available|ample/.test(marketConditions) ? "decrease" : "hold"
impactPct: /tightening|harden|restrict/.test(marketConditions) ? 5 : /soft|available|ample/.test(marketConditions) ? -3 : 0
severity: /tightening|harden/.test(marketConditions) ? "medium" : "low"
```

**Signal 4 — Risk controls quality**
```
driver: `Controls: ${riskControls.slice(0, 60) || "not stated"}`
direction: /incomplete|delay|weak|absent|outstanding/.test(riskControls.toLowerCase()) ? "increase" : /strong|complete|certified|accredited/.test(riskControls.toLowerCase()) ? "decrease" : "hold"
impactPct: /incomplete|delay|weak|absent|outstanding/.test(riskControls.toLowerCase()) ? 5 : /strong|complete|certified|accredited/.test(riskControls.toLowerCase()) ? -3 : 0
severity: severityFromDriver(riskControls)
```

**Signal 5 — Claims frequency and severity split** (new)
```
driver: `Claims trend: ${claimsTrend.slice(0, 60) || "not stated"}`
direction: /frequency increase|multiple|recurring|cluster/.test(claimsTrend.toLowerCase()) ? "increase" : /nil|no claims|stable|single/.test(claimsTrend.toLowerCase()) ? "hold" : "hold"
impactPct: /frequency increase|multiple|recurring|cluster/.test(claimsTrend.toLowerCase()) ? 6 : /nil|no claims/.test(claimsTrend.toLowerCase()) ? -2 : 1
severity: /frequency increase|multiple|high-severity/.test(claimsTrend.toLowerCase()) ? "high" : /single|stable/.test(claimsTrend.toLowerCase()) ? "low" : "medium"
```

**Signal 6 — Deductible adequacy** (new)
```
const deductible = parsed["DEDUCTIBLE GBP"] ?? ""
driver: deductible ? `Deductible at GBP ${deductible}` : "Deductible not stated"
direction: /low|reduce|below market/.test(deductible.toLowerCase()) ? "increase" : "hold"
impactPct: deductible ? 0 : 3   // missing deductible = risk to underwriter
severity: deductible ? "low" : "medium"
```

**Signal 7 — EML / limit utilisation** (new)
```
const eml = toNumber(parsed["EML GBP"])
const limit = toNumber(parsed["LIMIT GBP"])
driver: eml && limit ? `EML GBP ${eml.toLocaleString()} vs limit GBP ${limit.toLocaleString()}` : "EML or limit not stated"
direction: eml && limit && eml >= limit * 0.8 ? "increase" : "hold"
impactPct: eml && limit && eml >= limit * 0.8 ? 7 : eml && limit ? 0 : 2
severity: eml && limit && eml >= limit * 0.8 ? "high" : eml && limit ? "low" : "medium"
```

---

### 1d. Replace flat `totalImpact` sum with a weighted composite

The current `totalImpact` is a raw sum of all signal `impactPct` values. Replace with a weighted composite where loss ratio and claims trend carry higher weight:

```ts
const weighted =
  signals[0].impactPct * 0.30 +  // loss ratio
  signals[4].impactPct * 0.20 +  // claims trend
  signals[1].impactPct * 0.15 +  // exposure
  signals[3].impactPct * 0.15 +  // controls
  signals[2].impactPct * 0.10 +  // market
  signals[5].impactPct * 0.05 +  // deductible
  signals[6].impactPct * 0.05;   // EML

const totalImpact = Math.round(weighted);
```

---

### 1e. Add `deriveRenewalStrategy` function

```ts
type RenewalStrategy = "renew_flat" | "rate_increase_required" | "refer_to_senior" | "decline_renewal";

interface RenewalStrategyRecommendation {
  strategy: RenewalStrategy;
  rationale: string;
}
```

Logic (evaluate in priority order):

1. If `lossRatio >= 100` OR text contains `"sanctions"` or `"fraud"` → `"decline_renewal"`, rationale: `"Account is technically non-viable or carries compliance exposure that cannot be priced."`
2. If `lossRatio >= 80` OR `highRiskDrivers >= 3` OR `(eml >= limit * 0.8 && eml > 0 && limit > 0)` → `"refer_to_senior"`, rationale: `"Loss ratio or risk accumulation exceeds standard underwriting authority. Senior sign-off required before terms are offered."`
3. If `totalImpact >= 5` → `"rate_increase_required"`, rationale: `"Technical analysis indicates rate inadequacy. Movement of +${totalImpact}% is required to restore adequacy before renewal can be confirmed."`
4. Default → `"renew_flat"`, rationale: `"Account is within technical parameters. Flat renewal is supportable subject to controls confirmation and standard documentation."`

---

### 1f. Expand strategy memo from 3 to 6 lines

Replace the current 3-line memo with these 6 deterministic lines:

```ts
const strategyMemo = [
  `Recommended pricing direction: ${pricingDirection} (${totalImpact >= 0 ? "+" : ""}${totalImpact}%).`,
  `Technical rate adequacy: ${tra >= 0 ? "+" : ""}${tra}% vs target (${tra >= 0 ? "over-rated — room to hold or reduce" : "under-rated — increase required"}).`,
  `Loss ratio ${lossRatio}% — ${lossRatio >= 80 ? "above referral threshold of 80%" : lossRatio >= 65 ? "above target but within tolerance" : "within acceptable range"}.`,
  `Risk drivers: ${highRiskDrivers} high-severity signals identified across loss, exposure, and controls.`,
  `Renewal strategy: ${renewalStrategyRec.strategy.replace(/_/g, " ")} — ${renewalStrategyRec.rationale}`,
  `Open actions before authority sign-off: ${actionPlan.length}.`
];
```

---

### 1g. Expand negotiation talking points from 3 to 6

Replace current 3 points with these 6:

1. `Anchor on technical rate adequacy: current position is ${tra >= 0 ? "+" : ""}${tra}% — use this to defend the ${pricingDirection} position.`
2. `Reference the ${lossRatio}% loss ratio directly and compare to the market benchmark of 65% target combined ratio.`
3. `If broker pushes back on rate, offer deductible adjustment as an alternative lever — confirm deductible appetite before the meeting.`
4. `Tie any capacity commitment to evidence of controls completion — incomplete evidence ${/incomplete|delay|weak/.test(riskControls.toLowerCase()) ? "already flagged, make remediation a condition" : "has not been flagged — request confirmation proactively"}.`
5. `Frame exposure change of ${exposureChange}% as a natural basis for premium adjustment independent of rate movement.`
6. `${ltaText}` — where `ltaText` is: if `parsed["LTA"]` exists → `"Account is on LTA — movement constraints apply; confirm LTA terms before tabling any increase above agreed band."` else → `"No LTA flagged — standard market negotiation applies without structural movement constraints."`

---

### 1h. Expand action plan from 4 to 7 domain-specific items

Replace the 4 generic actions with 7 context-sensitive ones:

1. `Confirm pricing corridor: ${pricingDirection} direction with target movement ${totalImpact >= 0 ? "+" : ""}${totalImpact}%.`
2. `Obtain signed loss narrative and adjuster report for claims trend: ${claimsTrend || "not provided"}.`
3. `Request updated controls evidence — ${riskControls || "not stated"}. Make remediation completion a renewal condition if outstanding.`
4. `Validate EML against current limit — ${eml && limit ? `EML GBP ${eml.toLocaleString()} vs limit GBP ${limit.toLocaleString()}` : "EML or limit not provided — obtain survey confirmation before binding"}.`
5. `Confirm deductible adequacy — ${parsed["DEDUCTIBLE GBP"] ? `current GBP ${parsed["DEDUCTIBLE GBP"]} — benchmark against peer accounts` : "deductible not stated — request and benchmark"}.`
6. `${parsed["LTA"] ? `LTA in place — review LTA band before tabling movement. LTA: ${parsed["LTA"]}` : "No LTA — confirm broker position on multi-year terms if account is strategically important."}`
7. `Target effective date: ${parsed["TARGET EFFECTIVE DATE"] || "not stated"} — confirm authority sign-off window and align documentation deadline.`

---

### 1i. Expand whitespace table from 5 to 12 rows

Replace the current 5-row table with these 12 rows in order:

| fieldWording | parsed key |
|---|---|
| Insured | `INSURED` |
| Class / line of business | `CLASS` |
| Broker | `BROKER` |
| Policy period | `POLICY PERIOD` |
| Current premium (GBP) | `CURRENT PREMIUM GBP` |
| Prior year premium (GBP) | `PRIOR YEAR PREMIUM GBP` |
| Loss ratio (%) | `LOSS RATIO PCT` |
| Insured value (GBP) | `INSURED VALUE GBP` |
| Limit (GBP) | `LIMIT GBP` |
| EML (GBP) | `EML GBP` |
| Deductible (GBP) | `DEDUCTIBLE GBP` |
| LTA | `LTA` |

---

## 2. Types — `src/types/renewal-copilot.ts`

Add the following:

```ts
export type RenewalStrategy = "renew_flat" | "rate_increase_required" | "refer_to_senior" | "decline_renewal";

export interface RenewalStrategyRecommendation {
  strategy: RenewalStrategy;
  rationale: string;
}
```

Extend `RenewalSummary`:

```ts
export interface RenewalSummary {
  pricingDirection: "increase" | "decrease" | "hold";
  recommendedMovementPct: number;
  highRiskDrivers: number;
  openActions: number;
  technicalRateAdequacyPct: number;   // ADD
}
```

Extend `RenewalCopilotInsight`:

```ts
export interface RenewalCopilotInsight {
  summary: RenewalSummary;
  strategyMemo: string[];
  negotiationTalkingPoints: string[];
  pricingSignals: PricingSignal[];
  actionPlan: string[];
  warnings: string[];
  queryHits: string[];
  whitespaceRows: Array<{ fieldWording: string; extractedValue: string; status: "EXTRACTED" | "MISSING" }>;
  renewalStrategy: RenewalStrategyRecommendation;   // ADD
}
```

---

## 3. UI — `src/app/page.tsx`

### 3a. Add `technicalRateAdequacy` as a 5th MetricTile

In the Summary card, add a fifth tile after "Open actions":
- Label: `"Technical rate adequacy"`
- Value: `${result.analysis.summary.technicalRateAdequacyPct >= 0 ? "+" : ""}${result.analysis.summary.technicalRateAdequacyPct}%`

### 3b. Add a "Renewal strategy" card

Insert a new card between the Memo/Negotiation row and the Signals card:

- Eyebrow: `"Strategy"`
- Title: `"Renewal strategy recommendation"`
- Show a large pill badge with the strategy value colour-coded:
  - `renew_flat` → emerald
  - `rate_increase_required` → amber
  - `refer_to_senior` → orange
  - `decline_renewal` → red
- Display strategy label in title case with underscores replaced by spaces
- Below the badge, show the rationale text in `text-sm text-slate-700`

### 3c. Action plan card

The existing UI does not have a dedicated action plan card — the action plan is computed in the service but not surfaced. Add a card:

- Eyebrow: `"Actions"`
- Title: `"Pre-renewal action plan"`
- Numbered list rendering each `actionPlan` item (same style as agenda in Day 21)
- Insert this card after the Renewal strategy card and before the Signals card

---

## 4. Demo samples — `src/lib/demo-samples.ts`

Replace all three samples with richer London Market versions. Each sample must include all fields listed below.

Full field set:
`INSURED`, `CLASS`, `BROKER`, `POLICY PERIOD`, `CURRENT PREMIUM GBP`, `PRIOR YEAR PREMIUM GBP`, `LOSS RATIO PCT`, `CLAIMS TREND`, `EXPOSURE CHANGE PCT`, `INSURED VALUE GBP`, `LIMIT GBP`, `EML GBP`, `DEDUCTIBLE GBP`, `RISK CONTROLS`, `MARKET CONDITIONS`, `TARGET EFFECTIVE DATE`, `BROKER OBJECTIVE`, `LTA`

### Sample 1 — `balanced-renewal`

```
INSURED: Meridian Foods Plc
CLASS: Property — Food Manufacturing
BROKER: Clarke & Partners Specialty
POLICY PERIOD: 2026-07-01 to 2027-07-01
CURRENT PREMIUM GBP: 185000
PRIOR YEAR PREMIUM GBP: 174000
LOSS RATIO PCT: 42
CLAIMS TREND: Stable frequency with one moderate machinery breakdown claim GBP 38,000 settled in 2025; nil claims 2022-2024
EXPOSURE CHANGE PCT: 6
INSURED VALUE GBP: 48000000
LIMIT GBP: 25000000
EML GBP: 14000000
DEDUCTIBLE GBP: 75000
RISK CONTROLS: ISO 22000 accreditation renewed; upgraded CCTV and sprinkler maintenance logs complete; quarterly engineering survey sign-off received
MARKET CONDITIONS: Capacity broadly available; underwriter caution on fire load for food processing sites post-Ocado; stable to slight hardening for well-controlled accounts
TARGET EFFECTIVE DATE: 2026-07-01
BROKER OBJECTIVE: Secure flat renewal with no deductible increase; retain current limit structure
LTA: None
```

Label: `"Balanced renewal"`, description: `"Well-controlled food manufacturer with stable loss ratio, minor claims history, and modest exposure uplift."`

### Sample 2 — `hardening-market`

```
INSURED: Atlas Marine Logistics Ltd
CLASS: Marine Cargo — Open Cover (worldwide)
BROKER: Harbour Placement LLP
POLICY PERIOD: 2026-06-15 to 2027-06-15
CURRENT PREMIUM GBP: 420000
PRIOR YEAR PREMIUM GBP: 355000
LOSS RATIO PCT: 89
CLAIMS TREND: Frequency increase — two theft losses GBP 310,000 combined; one high-severity spoilage event GBP 480,000 under adjudication; three near-miss sanctions alerts on Russia-adjacent routing in Q1 2026
EXPOSURE CHANGE PCT: 14
INSURED VALUE GBP: 0
LIMIT GBP: 15000000
EML GBP: 12500000
DEDUCTIBLE GBP: 50000
RISK CONTROLS: Route-security evidence incomplete for high-risk corridors; sanctions control attestation delayed three months; cargo tracking system upgrade in progress — expected completion Q3 2026
MARKET CONDITIONS: Capacity tightening; Red Sea disruption premium loadings 15-25%; elevated deductible appetite in marine cargo segment; sanctions-exposed accounts facing additional compliance requirements
TARGET EFFECTIVE DATE: 2026-06-15
BROKER OBJECTIVE: Retain current line size of GBP 5,000,000; limit premium increase to no more than 10%
LTA: None
```

Label: `"Hardening market"`, description: `"Adverse loss ratio, frequency increase, EML approaching limit, and incomplete controls on a sanctioned-route marine account."`

### Sample 3 — `missing-required-gate`

Keep minimal to trigger validation:

```
INSURED: Short Note Co
CLASS: Property
CURRENT PREMIUM GBP:
LOSS RATIO PCT:
CLAIMS TREND:
EXPOSURE CHANGE PCT:
RISK CONTROLS:
MARKET CONDITIONS:
TARGET EFFECTIVE DATE:
BROKER OBJECTIVE:
```

Label: `"Missing required gate"`, description: `"Intentionally incomplete pack to trigger required-field validation and demonstrate the missing-gate error flow."`

---

## 5. Quality gates

Run and confirm all pass after implementation:

```sh
pnpm --filter @ai-ops/renewal-intelligence-copilot lint
pnpm --filter @ai-ops/renewal-intelligence-copilot typecheck
pnpm --filter @ai-ops/renewal-intelligence-copilot test
pnpm --filter @ai-ops/renewal-intelligence-copilot build
```

Existing service tests must be updated to cover:
- `computeTechnicalRateAdequacy` for over-rated, under-rated, and zero inputs
- `deriveRenewalStrategy` for all four output values
- 7-signal array length and correct weighted `totalImpact`
- Whitespace table row count (12 rows)
- Sample 1 produces `renew_flat` strategy
- Sample 2 produces `refer_to_senior` or `decline_renewal` strategy

---

## 6. Constraints for Codex

- Do **not** change the API route shape — `requestId`, `processingTimeMs`, `persistence.status` must remain.
- Do **not** add new npm packages.
- Do **not** introduce LLM/AI calls — all logic must remain deterministic.
- Do **not** change the Supabase persistence columns unless specifically requested — add `renewal_strategy` and `technical_rate_adequacy_pct` as nullable columns only if persistence is being updated; otherwise skip DB changes.
- Keep all existing cards; only add the two new cards (Renewal strategy, Action plan) and the fifth MetricTile.
- Maintain the existing visual style: `rounded-[16px]`/`rounded-[20px]` borders, Tailwind 4, colour token variables.
- The `PricingSignal` type shape must not change — only the values computed within it change.

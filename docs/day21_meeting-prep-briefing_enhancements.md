# Day 21 — Meeting Prep Briefing: Domain Depth Enhancement

## Context

App: `apps/meeting-prep-briefing`
Short name: `meetingprep`
Port: `3021`
Issue: The current service logic and demo samples are generic enterprise-level. They lack London Market / specialty insurance domain depth. This document specifies all changes needed.

---

## 1. Service layer — `src/services/analyze-meeting-prep.ts`

### 1a. Replace generic risk tokens with London Market vocabulary

**Current `highRiskTokens`:**
```ts
["sanctions", "deadline", "unresolved", "theft", "recall", "breach", "urgent", "escalat"]
```

**Replace with:**
```ts
const highRiskTokens = [
  "sanctions", "unresolved", "breach", "urgent", "escalat",
  "burning cost", "loss ratio", "aggregate", "pml", "eml",
  "refer", "referral", "exceed authority", "excess of line",
  "facultative", "recall", "theft", "fraud", "dispute",
  "total loss", "constructive total loss", "ctl",
  "late declaration", "bordereau overdue", "cedant default"
];
```

**Replace `mediumRiskTokens` with:**
```ts
const mediumRiskTokens = [
  "delay", "dependency", "remediation", "monitor", "follow-up",
  "lta", "long-term agreement", "hardening", "softening",
  "deductible change", "limit reduction", "capacity constraint",
  "co-insurance", "line change", "premium movement",
  "claims development", "reserve", "ibnr", "adjustment clause"
];
```

---

### 1b. Add new required and optional field constants

Add a constant for **optional but important** fields that should appear in the whitespace table even if absent:

```ts
const optionalFields = [
  "BROKER",
  "LINE OF BUSINESS",
  "PREMIUM",
  "LOSS RATIO",
  "LIMIT",
  "DEDUCTIBLE",
  "MARKET CONDITIONS",
  "DECISION DEADLINE"
] as const;
```

Keep existing `requiredFields` as-is:
```ts
["CLIENT", "MEETING DATE", "OBJECTIVE", "RISKS", "OPEN ITEMS", "STAKEHOLDERS"]
```

---

### 1c. Add a `deriveUwPosition` function

After parsing, derive an underwriter position recommendation:

```ts
type UwPosition = "hold" | "negotiate" | "refer" | "decline";

interface UwPositionRecommendation {
  position: UwPosition;
  rationale: string;
}
```

Logic rules (deterministic, in priority order):
1. If `highRiskCount >= 3` → `"decline"`, rationale: `"Multiple high-severity risk signals exceed acceptable threshold for this meeting."`
2. If text contains `"sanctions"` or `"fraud"` → `"refer"`, rationale: `"Sanctions or fraud indicators require referral to compliance and senior underwriting authority."`
3. If text contains `"refer"` or `"exceed authority"` or `"pml"` or `"eml"` → `"refer"`, rationale: `"Exposure signals or authority limits indicate this case needs a referral sign-off before commitment."`
4. If `highRiskCount >= 1` or open questions > 2 → `"negotiate"`, rationale: `"Risk cues and open items suggest terms are negotiable but commitment is conditional on resolution."`
5. Default → `"hold"`, rationale: `"Briefing is complete and risk posture is within normal parameters. Hold current terms pending meeting outcome."`

---

### 1d. Add a `buildAgenda` function

Generate an ordered meeting agenda from parsed fields:

```ts
interface AgendaItem {
  order: number;
  item: string;
  note: string;
}
```

Build agenda in this fixed priority order:
1. `"Introductions and context"` — note: `"Confirm attendees against stakeholder map."`
2. `"Review of meeting objective"` — note: from `OBJECTIVE` field or `"Objective not stated."`
3. `"Claims and loss history"` — note: from `LOSS RATIO` field or `"Loss ratio / claims history not provided — request before meeting."`; only include if `LOSS RATIO` or `CLAIMS HISTORY` is present OR risks mention `"loss"`, `"claim"`, or `"reserve"`
4. `"Risk cue review"` — note: `"Walk through extracted risk cues in severity order."`; only include if `riskCues.length > 0`
5. `"Open items resolution"` — note: first open item text, or `"Open items not stated."`; only include if `openQuestions.length > 0`
6. `"Premium and terms discussion"` — note: from `PREMIUM` field or `"Premium details not provided — confirm prior year and proposed movement."`
7. `"Capacity and limit position"` — note: from `LIMIT` field or `"Limit not specified — confirm with market before commitment."`; only include if `LIMIT` field exists or risks mention `"capacity"`, `"limit"`, `"pml"`, `"eml"`
8. `"Decision and next steps"` — note: from `DECISION DEADLINE` or `"Deadline not stated — agree at meeting close."`

Always include items 1, 2, 6, and 8. Include items 3, 4, 5, 7 conditionally as above. Re-number `order` sequentially after filtering.

---

### 1e. Expand `talkingPoints` from 3 to 6

Replace the 3 hardcoded talking points with these 6:

1. **Meeting objective** — `parsed["OBJECTIVE"]` or `"Objective not provided."` — severity: `"low"`
2. **Premium and pricing position** — `parsed["PREMIUM"]` or `"Premium details not provided — request prior year and proposed movement from broker."` — severity: `severityFromText(parsed["PREMIUM"] ?? "")`
3. **Loss ratio and claims posture** — `parsed["LOSS RATIO"]` or `parsed["CLAIMS HISTORY"]` or `"No loss data in briefing — obtain before meeting."` — severity: if text contains `"adverse"`, `"deteriorat"`, `"above benchmark"` → `"high"`; if contains `"stable"`, `"below"`, `"nil claims"` → `"low"`; else `"medium"`
4. **Primary risk posture** — `risks` value or `"Risk narrative missing."` — severity: `severityFromText(risks)`
5. **Capacity and limit position** — `parsed["LIMIT"]` or `"Limit and capacity not stated — confirm EML/PML before commitment."` — severity: `severityFromText(parsed["LIMIT"] ?? "")`
6. **Decision timeline and authority** — `parsed["DECISION DEADLINE"]` or `"Decision deadline not provided."` — severity: if deadline is present and within 3 days of `MEETING DATE` (string comparison heuristic: same week) → `"high"`; else `"low"`

---

### 1f. Expand whitespace table rows

Replace the current 5 rows with these 10:

| fieldWording | parsed key | notes |
|---|---|---|
| Client | `CLIENT` | required |
| Meeting date | `MEETING DATE` | required |
| Objective | `OBJECTIVE` | required |
| Broker | `BROKER` | optional |
| Line of business | `LINE OF BUSINESS` | optional |
| Premium | `PREMIUM` | optional |
| Loss ratio | `LOSS RATIO` | optional |
| Limit / capacity | `LIMIT` | optional |
| Deductible / excess | `DEDUCTIBLE` | optional |
| Open items | derived from `openQuestionList.join(" | ")` | required |

---

### 1g. Add `marketContext` to the returned insight

Add a simple market context signal:

```ts
type MarketContext = "hardening" | "softening" | "stable" | "unknown";
```

Derive from full briefing text:
- Contains `"hardening"` or `"rate increase"` or `"capacity tightening"` → `"hardening"`
- Contains `"softening"` or `"rate reduction"` or `"increased capacity"` → `"softening"`
- Contains `"stable"` or `"flat renewal"` or `"unchanged terms"` → `"stable"`
- Otherwise → `"unknown"`

---

### 1h. Return shape additions

The `analyzeMeetingPrep` function return `insight` object must be extended to include:

```ts
uwPosition: UwPositionRecommendation;   // new
agenda: AgendaItem[];                   // new
marketContext: MarketContext;            // new
```

---

## 2. Types — `src/types/meeting-prep.ts`

Add the following types:

```ts
export type UwPosition = "hold" | "negotiate" | "refer" | "decline";

export interface UwPositionRecommendation {
  position: UwPosition;
  rationale: string;
}

export type MarketContext = "hardening" | "softening" | "stable" | "unknown";

export interface AgendaItem {
  order: number;
  item: string;
  note: string;
}
```

Extend `MeetingPrepInsight`:

```ts
export interface MeetingPrepInsight {
  summary: MeetingPackSummary;
  contextOverview: string[];
  stakeholderMap: string[];
  riskCues: string[];
  talkingPoints: TalkingPoint[];
  openQuestions: string[];
  queryHits: string[];
  warnings: string[];
  whitespaceRows: Array<{ fieldWording: string; extractedValue: string; status: "EXTRACTED" | "MISSING" }>;
  uwPosition: UwPositionRecommendation;   // ADD
  agenda: AgendaItem[];                   // ADD
  marketContext: MarketContext;            // ADD
}
```

---

## 3. UI — `src/app/page.tsx`

### 3a. Add two new result cards

After the existing **Talking points** card and before **Whitespace**, insert:

**Card 1 — Underwriter position**
- Eyebrow: `"Position"`
- Title: `"Underwriter position recommendation"`
- Show a large pill badge with the position value (`hold` / `negotiate` / `refer` / `decline`) colour-coded:
  - `hold` → emerald
  - `negotiate` → amber
  - `refer` → orange
  - `decline` → red
- Below the badge, show the rationale text in `text-sm text-slate-700`

**Card 2 — Meeting agenda**
- Eyebrow: `"Agenda"`
- Title: `"Suggested meeting agenda"`
- Render as a numbered list, one item per row:
  - Left: `order`. + `item` (bold)
  - Right: `note` in `text-slate-500 text-sm`
  - Separate with a thin `border-b border-slate-100`

### 3b. Add `marketContext` to the summary MetricTile grid

Add a fifth MetricTile to the existing 2x2 summary grid:
- Label: `"Market context"`
- Value: the `marketContext` string with first letter capitalised

---

## 4. Demo samples — `src/lib/demo-samples.ts`

Replace all three samples with richer London Market versions. Each sample must include all of: `CLIENT`, `MEETING DATE`, `BROKER`, `LINE OF BUSINESS`, `UNDERWRITER`, `OBJECTIVE`, `PREMIUM`, `LOSS RATIO`, `LIMIT`, `DEDUCTIBLE`, `POSITIVES`, `RISKS`, `OPEN ITEMS`, `STAKEHOLDERS`, `DECISION DEADLINE`, `MARKET CONDITIONS`.

### Sample 1 — `balanced-renewal-briefing`

```
CLIENT: Northbridge Food Ingredients Ltd
MEETING DATE: 2026-04-14
BROKER: Aegis Specialty Partners
LINE OF BUSINESS: Products Liability / Property Combined
UNDERWRITER: London Property & Liability Team
OBJECTIVE: Renewal terms discussion and capacity confirmation for combined programme
PREMIUM: £380,000 prior year; proposed movement +6% reflecting inflationary exposure uplift
LOSS RATIO: 42% five-year average; nil claims in current year; one minor subrogation recovered in 2023
LIMIT: £25,000,000 any one occurrence; £50,000,000 aggregate
DEDUCTIBLE: £100,000 own damage; £250,000 products liability
POSITIVES: No material claims in five years; upgraded plant CCTV and sprinkler maintenance logs complete; ISO 22000 accreditation renewed
RISKS: One unresolved product recall matter in active legal defence; dependency on two key raw material suppliers in single geography; deductible adequacy review overdue
OPEN ITEMS: Confirm supply-chain testing cadence documentation; validate deductible preference against peer benchmarks; obtain updated EML survey report
STAKEHOLDERS: CFO, Risk Manager, Broking Lead, Claims Advocate
DECISION DEADLINE: 2026-04-25
MARKET CONDITIONS: Stable to slightly hardening for food sector; capacity broadly available at benchmark terms
```

Label: `"Balanced renewal"`, description: `"Complete renewal pack with financial metrics, moderate risk cues, and clear next actions for a food ingredients client."`

### Sample 2 — `high-risk-referral`

```
CLIENT: Atlas Maritime Logistics
MEETING DATE: 2026-04-09
BROKER: Harbour Placement LLP
LINE OF BUSINESS: Marine Cargo — Open Cover
UNDERWRITER: Marine Cargo Referral Desk
OBJECTIVE: Mid-term review after sanctions route disruption and cargo theft cluster
PREMIUM: £1,200,000 annualised; current year projected to £1,450,000 on adjusted declarations
LOSS RATIO: 87% current year; 64% prior year; adverse claims development on high-value electronics cargo
LIMIT: USD 15,000,000 any one sending; EML under review pending updated voyage routing
DEDUCTIBLE: USD 50,000 per occurrence; theft sub-limit USD 500,000
POSITIVES: Strong internal audit cadence and quarterly compliance training; automated declaration system in place
RISKS: Two recent near-miss sanctions alerts on Russia-adjacent routing; delayed declarations from one regional office creating bordereau gaps; unresolved high-value cargo theft claim USD 2.1M in adjudication; loss ratio exceeds 80% referral threshold
OPEN ITEMS: Confirm sanctions control ownership and document routing override authority; evidence declaration remediation timetable; agree interim capacity guardrails pending EML re-survey; obtain signed compliance attestation
STAKEHOLDERS: COO, Compliance Lead, Broking Director, Claims Counsel, Sanctions Officer
DECISION DEADLINE: 2026-04-11
MARKET CONDITIONS: Hardening; marine cargo capacity constrained following Red Sea disruption; markets seeking rate increases of 15–25% on adverse-loss accounts
```

Label: `"High-risk referral"`, description: `"Compressed timeline with sanctions alerts, adverse loss ratio, and open claims requiring referral and compliance sign-off."`

### Sample 3 — `missing-required-gate`

```
CLIENT: Short Note Co
MEETING DATE:
OBJECTIVE: Quick discussion
RISKS:
OPEN ITEMS:
STAKEHOLDERS:
```

Label: `"Missing required gate"`, description: `"Intentionally incomplete input to trigger required-field validation and demonstrate the missing-gate error flow."`

---

## 5. Quality gates

After implementing all changes, run and confirm all pass:

```sh
pnpm --filter @ai-ops/meeting-prep-briefing lint
pnpm --filter @ai-ops/meeting-prep-briefing typecheck
pnpm --filter @ai-ops/meeting-prep-briefing test
pnpm --filter @ai-ops/meeting-prep-briefing build
```

No new test files are needed — the existing service unit tests should be updated to cover:
- `deriveUwPosition` for all four output values
- `buildAgenda` conditional inclusion rules
- `marketContext` derivation for each of the four values
- Expanded whitespace table row count (10 rows)

---

## 6. Constraints for Codex

- Do **not** change the API route shape — `requestId`, `processingTimeMs`, `persistence.status` must remain.
- Do **not** change the Supabase persistence columns — add `uw_position`, `agenda`, `market_context` as new nullable JSONB columns only if persistence is being updated; otherwise skip DB changes.
- Do **not** introduce LLM/AI calls — all logic must remain deterministic.
- Do **not** add new npm packages.
- Keep all existing cards on the UI page; only add the two new ones and the fifth MetricTile.
- Maintain the existing visual style: `rounded-[16px]`/`rounded-[20px]` borders, Tailwind 4, colour token variables.

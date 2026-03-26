# Day 18 — Placement Tracker: Enhancement Spec

**Date:** 2026-03-25
**Author:** Poovannan Rajendran
**App path:** `apps/placement-tracker/`
**Dev port:** 3018
**Scope:** UI depth + domain usefulness enhancements — no backend schema changes required

---

## Context for Codex

The Day 18 Placement Tracker app (`apps/placement-tracker/`) is already built and working. The service layer (`src/services/analyze-placement.ts`) computes rich data — market progression rows, executive commentary, action list, status lanes, and query hits — but **most of that data is never rendered in the UI**. The current page only shows two small cards: a 5-line text summary and a priority flags list.

This document specifies **exactly what to add** to make the app genuinely useful for a placing broker. All changes are confined to `src/app/page.tsx` and `src/lib/demo-samples.ts`. The types and service layer are complete — do not change them.

Read these files before touching anything:
- `src/types/placement-tracker.ts` — all data shapes
- `src/services/analyze-placement.ts` — what the service already computes
- `src/app/page.tsx` — current UI (two result cards only)
- `src/lib/demo-samples.ts` — demo CSV samples

---

## Enhancement 1 — Render the Market Progression Table

**Why:** The service already computes `analysis.marketProgression` — a per-market breakdown with signed GBP, target GBP, remaining %, follow-up age, and priority. This is the most important output for a broker and is currently invisible.

**What to build:** A full-width table below the existing summary/flags cards. One row per market.

### Columns (left to right)

| Column | Source field | Notes |
|--------|-------------|-------|
| Market | `marketName` | |
| Status | `status` | Render as a pill badge. Colour map: `placed` → green, `quoted` → blue, `follow-up` → amber, `open` → slate, `declined` → red, `hold` → grey |
| Priority | `priority` | Render as a coloured dot. `critical` → red, `watch` → amber, `stable` → green |
| Target line | `targetLineGbp` | Format as `£X.Xm` (divide by 1,000,000, 1 dp) |
| Signed | `signedLineGbp` | Same format |
| Projected | `projectedLineGbp` | Same format |
| Remaining | `remainingSharePct` | Show as `X%`. If > 0 and status is not placed, colour amber/red |
| Follow-up age | `followUpAgeDays` | Show as `Xd`. Apply colour: 0–2 = slate, 3–4 = amber, ≥5 = red |
| Capacity change | `capacityChangePct` | Show as `+X%` or `-X%`. Negative = red, positive = green |
| Broker | `broker` | |

### Acceptance criteria
- Table is sortable by Priority (default sort: critical first, then watch, then stable)
- Table is responsive — on mobile, collapse to a card-per-row layout using the same fields
- Table sits inside a `Card` component (from `@ai-ops/common-ui`) with eyebrow "Markets" and title "Market progression"
- Only renders when `result` is non-null

---

## Enhancement 2 — Placement Progress Bar

**Why:** The three key numbers (placed %, projected %, target %) are currently shown as plain text. A visual fill makes placement health scannable in under a second.

**What to build:** A stacked/layered horizontal progress bar directly inside the existing "Placement overview" summary card, below the text metrics.

### Spec

```
|██████████████░░░░░░░░░░░░░░░░░░░░|
 Placed 45%    Projected 68%    Target 100%
```

- The bar is a single `div` with `relative` positioning, height `h-4`, rounded, background `slate-100`
- Layer 1 (bottom): projected share — fill width = `(projectedSharePct / totalTargetSharePct) * 100%` — colour `bg-sky-300`
- Layer 2 (top, absolute): placed share — fill width = `(placedSharePct / totalTargetSharePct) * 100%` — colour `bg-emerald-500`
- A thin vertical marker line at 100% of target (rightmost edge, always full)
- Below the bar: three labels — "Placed X%" (green text), "Projected X%" (sky text), "Target X%" (slate text)
- Source fields: `result.analysis.summary.placedSharePct`, `projectedSharePct`, `totalTargetSharePct`

### Acceptance criteria
- Bar renders inside the existing summary card, between the text metrics and the card border
- Percentages are already rounded to 1 dp by the service — display as-is, no re-calculation

---

## Enhancement 3 — Commentary and Action List Panel

**Why:** The service builds `analysis.commentary` with an `executiveSummary`, `observations[]` (3 bullets), and `actions[]` (3 prioritised actions). None of this is rendered. The action list is the highest-value output for a placing broker — it tells them what to do next.

**What to build:** A full-width card below the market progression table.

### Layout

```
[Card eyebrow="Briefing" title="Placement commentary"]

  Executive summary paragraph
  ─────────────────────────────
  Observations          Actions
  • Bullet 1            1. Action 1 (chase marker)
  • Bullet 2            2. Action 2
  • Bullet 3            3. Action 3
```

### Spec
- Source: `result.analysis.commentary.executiveSummary`, `.observations`, `.actions`
- Executive summary: full-width paragraph, `text-slate-700 text-sm leading-7`
- A `<hr>` divider below summary
- Two-column grid below divider (`xl:grid-cols-2`):
  - Left column: "Observations" heading (`text-xs uppercase tracking-wide text-slate-500`) + unordered list of observations, each with a `→` prefix
  - Right column: "Actions" heading + ordered list of actions. Each action rendered as a `li` with a numbered circle badge (`w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center`) inline-flex with the text
- Only renders when `result` is non-null

---

## Enhancement 4 — Status Lane Summary Strip

**Why:** The service computes `statusLanes` (Placed vs Open — count, share %, avg follow-up age). This gives a fast portfolio-level read before drilling into individual markets.

**What to build:** A two-cell horizontal strip between the intake card and the summary/flags row.

### Layout

```
[  Placed  |  2 markets  |  45% of target  |  avg 1.0d  ]
[   Open   |  3 markets  |  55% of target  |  avg 5.7d  ]
```

Actually render as two side-by-side stat tiles, each full-height, not a strip. Use the `Card` component.

### Spec
- Source: `result.analysis.statusLanes` (array of `StatusLane` — always 2 items: Placed, Open)
- Each tile: eyebrow = lane label (`"Placed"` or `"Open"`), three stats displayed as metric pairs
  - Markets: `count` (number)
  - Target share: `sharePct%`
  - Avg follow-up age: `avgFollowUpAgeDays` days
- Placed lane: accent colour `emerald`, Open lane: accent colour `amber`
- Insert this section between the intake `Card` and the existing summary/flags `div` row
- Only renders when `result` is non-null

---

## Enhancement 5 — Query Hits Panel

**Why:** The user can type a free-text question (e.g. "which markets are stale?") and the service returns up to 6 matching lines from `queryHits[]`. These are never shown.

**What to build:** A collapsible panel that appears only when `result.analysis.queryHits.length > 0`.

### Spec
- Render inside a `Card` with eyebrow "Search" and title `Query: "<question>"` (interpolate the user's question)
- Each hit rendered as a `<code>` block (monospace, `text-xs`, `bg-slate-50 rounded-xl px-3 py-2`)
- If `queryHits` is empty, render nothing (no empty card)
- Position: between the status lane strip and the summary/flags row

---

## Enhancement 6 — Richer Demo Samples

**Why:** The current samples only cover a single class (Property, Marine Cargo). Real brokers work across multi-class programmes and need to see follow-up urgency driven by upcoming inception dates.

**What to add** to `src/lib/demo-samples.ts`:

### Sample 4 — Multi-class programme

```
id: "multi-class-programme"
label: "Multi-class programme"
description: "Energy programme with five lines across Property, Marine, and Liability — two markets declined, one stale."
question: "Which declined lines need replacement and how much capacity is at risk?"
sourceLabel: "multi-class-programme.csv"
csvText: (see CSV below)
```

**CSV:**
```
placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-780,Caspian Energy Ltd,Global Risk Partners,Pinnacle Syndicate,Placed,25,25,25,25000000,1125000,1,0,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Continental Re,Placed,20,20,20,25000000,1125000,2,3,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Meridian Specialty,Declined,20,0,0,25000000,1125000,9,-25,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Pacific Underwriters,Follow Up,20,0,12,25000000,1125000,8,-10,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Nordic Lines,Open,15,0,0,25000000,1125000,3,-5,Energy,Kazakhstan
```

### Sample 5 — Near-full placement

```
id: "near-full-placement"
label: "Near full placement"
description: "Programme 95% placed, small open tail, renewal due in 5 days."
question: "What is the remaining open capacity and is placement on track?"
sourceLabel: "near-full-placement.csv"
csvText: (see CSV below)
```

**CSV:**
```
placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-920,Thames Valley Power,City Brokers,Alpha Syndicate,Placed,30,30,30,18000000,720000,1,2,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Beta Markets,Placed,25,25,25,18000000,720000,1,1,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Gamma Re,Placed,20,20,20,18000000,720000,1,0,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Delta Specialty,Placed,20,20,20,18000000,720000,2,3,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Epsilon Lines,Open,5,0,5,18000000,720000,2,-2,Power Generation,United Kingdom
```

---

## Enhancement 7 — Kanban Column View (toggle)

**Why:** The roadmap spec explicitly described this app as "Kanban board for placement progress". A toggleable Kanban view groups markets by status column.

**What to build:** A view toggle (Table | Kanban) above the market progression section.

### Spec
- Two-button toggle: "Table" (default) | "Kanban"
- Toggle stored in local component state (`useState`)
- Kanban layout: horizontal flex row of status columns, each a rounded card
- Columns in order: Open → Quoted → Follow-up → Placed → Declined → Hold
- Only show columns that have at least one market in them
- Each column header: status name + count badge
- Each market card inside a column shows: market name, `signedSharePct%` / `targetSharePct%`, follow-up age badge, priority dot
- Column colours match status badge colours from Enhancement 1
- Only renders when `result` is non-null

---

## What NOT to change

- `src/services/analyze-placement.ts` — service logic is complete, do not modify
- `src/types/placement-tracker.ts` — types are complete, do not modify
- `src/app/api/placementtracker/analyze/route.ts` — API route is complete, do not modify
- `db/init_placementtracker.sql` — schema is complete, do not modify
- Any test files — existing tests must continue to pass; add new tests if new logic is introduced

---

## Implementation Order

Implement in this order to allow incremental testing:

1. **Enhancement 2** (progress bar) — easiest, inside an existing card
2. **Enhancement 4** (status lane strip) — two new stat tiles, data already in `statusLanes`
3. **Enhancement 1** (market progression table) — most data, most visual impact
4. **Enhancement 3** (commentary + actions panel) — renders existing commentary data
5. **Enhancement 5** (query hits panel) — conditional, only when hits exist
6. **Enhancement 6** (new demo samples) — extend `demoSamples` array with 2 new items
7. **Enhancement 7** (Kanban toggle) — most complex; build after the table works

---

## Quality Gates (must pass before done)

```sh
pnpm --filter @ai-ops/placement-tracker lint
pnpm --filter @ai-ops/placement-tracker typecheck
pnpm --filter @ai-ops/placement-tracker test
pnpm --filter @ai-ops/placement-tracker build
```

All must return zero errors. The dev server must start clean on port 3018 with no console errors.

### Visual checks
After implementation, run the app on port 3018 and verify:
- [ ] Progress bar renders and fills correctly on "Smart follow gap" sample
- [ ] Market table shows all 5 markets with correct status badges and priority dots
- [ ] Commentary card shows the executive summary, observations, and actions
- [ ] Status lane strip shows Placed and Open tiles with correct counts and share %
- [ ] Query hits appear when a question is typed (use "which markets are stale?" as test)
- [ ] Kanban view shows correct columns when toggled from Table view
- [ ] New demo samples load and produce valid analysis

---

## Reference: Existing colour variables

The app uses CSS variables defined in `globals.css`. Use these — do not hardcode hex values:

- `var(--accent)` — primary teal action colour
- `var(--accent-strong)` — darker teal
- `var(--accent-soft)` — light teal background
- `var(--hero-border)` — hero section border

For status-specific colours, use Tailwind utilities directly (e.g. `bg-emerald-500`, `bg-amber-400`, `bg-red-500`, `bg-sky-400`, `bg-slate-300`).

---

## Reference: Component imports available

```tsx
import { AppGroupLogo, Card } from "@ai-ops/common-ui";
```

The `Card` component signature:
```tsx
<Card eyebrow="string" title="string">
  {children}
</Card>
```

Use `Card` for all new result sections to maintain visual consistency with the rest of the app.

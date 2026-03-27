# Day 30 — Loss Ratio Triangulator
## Reserving Intelligence Capstone

**Replaces:** `challenge-portfolio-showcase`
**Folder:** `apps/loss-ratio-triangulator`
**Package name:** `@ai-ops/loss-ratio-triangulator`
**Short name:** `lossratiotriangulator`
**Supabase schema:** `app_lossratiotriangulator`
**Dev port:** `3030`
**Bucket:** Underwriting / Reserving
**Week arc:** Week 5 — Capstone ("I understand not just the front book, but how the tail develops.")

---

## 1. Purpose and Positioning

### Real-world problem
Every London Market syndicate and carrier runs a quarterly reserving cycle. Actuaries, CFOs, and Active Underwriters must estimate the **ultimate cost of claims** for each accident year — including claims that have been incurred but not yet reported (IBNR). This is done using **loss development triangles**: a matrix of cumulative paid (or incurred) losses at successive development maturities (12, 24, 36, 48, 60 months, etc.).

The dominant deterministic method is the **Chain-Ladder** (also called Bornhuetter-Ferguson stage 1), which:
1. Computes age-to-age loss development factors (LDFs) from historical diagonal patterns
2. Projects each accident year to ultimate using the product of selected LDFs
3. Derives IBNR = Ultimate − Latest diagonal

In practice this work lives in Excel, takes hours to set up correctly, and is prone to formula drift. This app provides a browser-native, audit-ready reserving engine that a CFO or Active Underwriter can demo in 90 seconds.

### Target personas
- **Reserving Actuary** — validates their quarterly IBNR estimates; wants LDF selection logic made explicit
- **Active Underwriter** — needs a fast "what is our IBNR exposure?" view before a board meeting
- **CFO / Finance Director** — wants a defensible reserve number with clear inputs and a trail

### Portfolio positioning
This is the only app in the 30-day suite that touches reserving mathematics. It closes the final gap in the actuarial/finance coverage and serves as a technically credible capstone for the challenge narrative.

---

## 2. Scope — Phase 1 (Day 30)

Build and ship:
- CSV triangle paste intake (accident year rows × development period columns)
- Cumulative triangle construction (auto-converts incremental to cumulative if needed)
- Weighted volume-average LDF calculation for each development period transition
- Optional tail factor input
- Chain-Ladder projection to ultimate for every accident year
- IBNR = Ultimate − Latest diagonal, per accident year and in total
- % Developed indicator per accident year
- Confidence assessment (based on triangle completeness and LDF stability)
- Full whitespace/extraction table
- Supabase persistence (runs + audit)
- 3 sample scenarios (mature triangle, immature triangle, sparse/missing cells)

Phase 2 (future, not Day 30):
- Bornhuetter-Ferguson method
- Cape-Cod expected loss ratio method
- Mack variance / prediction error
- Export to CSV

---

## 3. File Structure

```
apps/loss-ratio-triangulator/
├── db/
│   └── init_lossratiotriangulator.sql
├── samples/
│   └── SOURCES.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── lossratiotriangulator/
│   │   │       └── analyze/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   ├── icon.svg
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── loss-ratio-triangulator-logo.tsx
│   ├── lib/
│   │   └── demo-samples.ts
│   ├── services/
│   │   └── analyze-triangle.ts
│   └── types/
│       └── triangle.ts
├── tests/
│   ├── analyze-triangle.test.ts
│   └── analyze-route.test.ts
├── next.config.ts
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

---

## 4. TypeScript Types (`src/types/triangle.ts`)

```typescript
/** Raw triangle input — rows are accident years, cols are development periods */
export interface TriangleInput {
  triangleText: string;   // CSV or whitespace-delimited text pasted by user
  sourceLabel?: string;
  question?: string;
}

/** A single cell in the cumulative triangle */
export type TriangleCell = number | null;

/** Cumulative loss triangle: accidentYears × devPeriods */
export interface CumulativeTriangle {
  accidentYears: number[];         // e.g. [2019, 2020, 2021, 2022, 2023]
  devPeriods: number[];            // e.g. [12, 24, 36, 48, 60]
  cells: TriangleCell[][];         // [accidentYearIndex][devPeriodIndex]
  inputType: "cumulative" | "incremental";
}

/** Age-to-age loss development factor for one period transition */
export interface LDF {
  fromPeriod: number;              // e.g. 12
  toPeriod: number;                // e.g. 24
  weightedAvgFactor: number;       // volume-weighted average LDF, e.g. 1.842
  selectedFactor: number;          // same as weightedAvgFactor in Phase 1
  dataPoints: number;              // number of pairs used in calculation
}

/** Ultimate estimate and IBNR for one accident year */
export interface AccidentYearResult {
  accidentYear: number;
  latestDiagonal: number;          // latest known cumulative paid
  latestDevPeriod: number;          // development period of latest diagonal
  cumulativeLDF: number;           // product of remaining LDFs to ultimate
  ultimateEstimate: number;        // latestDiagonal × cumulativeLDF
  ibnr: number;                    // ultimateEstimate − latestDiagonal
  pctDeveloped: number;            // latestDiagonal / ultimateEstimate × 100
  isProjected: boolean;            // false if fully developed
}

/** Summary statistics for the whole triangle */
export interface TriangleSummary {
  completenessPct: number;         // % of expected cells with data
  totalUltimate: number;
  totalPaid: number;               // sum of latest diagonals
  totalIbnr: number;               // totalUltimate − totalPaid
  ibnrToPaidRatio: number;         // totalIbnr / totalPaid
  tailFactor: number | null;       // user-supplied or null
  confidence: "high" | "medium" | "low";
  warnings: string[];
  reservingBand: "adequate" | "watch" | "strengthening-required";
}

/** Full analysis output */
export interface TriangleInsight {
  summary: TriangleSummary;
  triangle: CumulativeTriangle;
  ldfs: LDF[];
  results: AccidentYearResult[];
  methodology: string[];           // plain-English methodology narrative lines
  auditNotes: string[];            // reviewable computation notes (LDF selection rationale, etc.)
  promptHits: string[];
  whitespaceRows: TriangleWhitespaceRow[];
}

export type ExtractionStatus = "EXTRACTED" | "MISSING" | "INFERRED";

export interface TriangleWhitespaceRow {
  fieldWording: string;
  extractedValue: string;
  status: ExtractionStatus;
  optional?: boolean;
}
```

---

## 5. Service Logic (`src/services/analyze-triangle.ts`)

### 5.1 CSV Parsing

The user pastes the triangle as a CSV or tab-delimited block. Two supported formats:

**Format A — Header row with accident year column:**
```
AY,12,24,36,48,60
2019,1200,2150,2580,2720,2780
2020,1350,2400,2890,3050
2021,1100,1980,2410
2022,1280,2280
2023,1150
```

**Format B — Header-less with accident years as first column (auto-detected):**
```
2019,1200,2150,2580,2720,2780
2020,1350,2400,2890,3050
...
```

**Format C — Incremental (detected by checking if values decrease across a row):**
If any row's values are non-monotonically-increasing, treat as incremental and cumulate.

Parsing rules:
- Strip `£`, `$`, `,`, spaces from numeric cells
- Treat empty cells and `-` as `null`
- First column is accident year if all values in it are 4-digit years (1990–2040)
- First row is development periods if all values are integers (e.g. 12, 24, 36, 48, 60) or look like month labels
- If no explicit dev periods, infer as 12, 24, 36 … N×12
- Minimum viable triangle: 2 accident years × 2 development periods

### 5.2 Cumulative Triangle Construction

If input is incremental, sum across each row to produce cumulative cells.
If input is already cumulative, use as-is and record `inputType: "cumulative"`.

### 5.3 Chain-Ladder LDF Calculation

For each development period transition `(d → d+1)`:

```
weightedAvgLDF(d → d+1) =
  Σ cumCell[ay][d+1]  (for all ay where both cells exist)
  ÷
  Σ cumCell[ay][d]    (for same ay pairs)
```

Rules:
- Only use pairs where both cells are non-null
- Minimum 1 data point required to compute a factor; if 0, emit a warning and use `1.000`
- Round LDFs to 4 decimal places for display; use full precision for computation
- Record `dataPoints` (number of valid pairs used per transition)

### 5.4 Tail Factor

- If the user provides `tail_factor=<value>` in the text block alongside the triangle, apply it to the last LDF
- If not provided, default `tailFactor = null` and note in `auditNotes`: "No tail factor applied. Ultimate estimates reflect development to final observed period only."
- Emit a warning if the triangle does not reach at least 60 months (5 years) of development — short tails are materially uncertain

### 5.5 Cumulative LDF to Ultimate

For each accident year `ay`:
- Identify the latest non-null diagonal: `latestDevPeriod` and `latestDiagonal`
- Compute the product of all selected LDFs from `latestDevPeriod` to ultimate (including tail factor if provided)
- `ultimateEstimate = latestDiagonal × cumulativeLDF`
- `ibnr = ultimateEstimate − latestDiagonal`
- `pctDeveloped = latestDiagonal / ultimateEstimate × 100`
- If `pctDeveloped ≥ 99.5%`, mark `isProjected = false` (fully developed)

### 5.6 Summary Statistics

- `totalUltimate` = Σ ultimateEstimate
- `totalPaid` = Σ latestDiagonal
- `totalIbnr` = totalUltimate − totalPaid
- `ibnrToPaidRatio` = totalIbnr / totalPaid
- `completenessPct` = (non-null cells ÷ total expected cells) × 100

### 5.7 Confidence Assessment

| Condition | Confidence |
|-----------|------------|
| completenessPct ≥ 80 AND all LDF dataPoints ≥ 3 AND no warnings | `high` |
| completenessPct ≥ 50 AND most LDF dataPoints ≥ 2 | `medium` |
| anything else | `low` |

### 5.8 Reserving Band

| Condition | Band |
|-----------|------|
| ibnrToPaidRatio ≤ 0.15 AND pctDeveloped ≥ 85% for all AYs | `adequate` |
| ibnrToPaidRatio ≤ 0.35 OR any AY pctDeveloped < 60% | `watch` |
| ibnrToPaidRatio > 0.35 OR confidence = "low" | `strengthening-required` |

### 5.9 Warnings (emitted into `summary.warnings`)

- Triangle has fewer than 3 accident years — LDF volume weighting is unreliable
- Triangle development does not extend to 60+ months — tail uncertainty is unquantified
- One or more LDF transitions computed from a single data point — factor is volatile
- Any accident year is less than 30% developed — ultimate estimates are speculative
- Cells in the lower-right triangle appear non-null (possible data entry error — lower-right should be blank for an as-at date triangle)

### 5.10 Methodology Narrative

Generate 3–5 plain-English lines such as:
- "Chain-Ladder method applied to a {N} accident year × {M} development period cumulative triangle."
- "Volume-weighted average LDFs range from {min} (tail) to {max} (12→24 months)."
- "Total IBNR of £{totalIbnr} represents {ibnrToPaidRatio×100}% of paid losses."
- "Oldest accident year ({year}) is {pctDeveloped}% developed; youngest ({year}) is {pctDeveloped}% developed."
- "No tail factor applied — ultimate estimates reflect development to {lastPeriod}-month maturity only." (if no tail)

### 5.11 Audit Notes

Generate reviewable computation notes:
- LDF used for each transition with dataPoints count
- Input type detected (cumulative / incremental)
- Tail factor applied or not
- Accident years where IBNR > latest diagonal (large projected development — flag as notable)

### 5.12 Prompt Hits

Generate 2–3 query snippets the user could ask:
- "Show development factors for all period transitions"
- "Which accident year has the highest IBNR exposure?"
- "What is the total reserve requirement including tail?"

---

## 6. API Route (`src/app/api/lossratiotriangulator/analyze/route.ts`)

### Request schema (Zod)
```typescript
z.object({
  triangleText: z.string().min(30, "Provide at least 2 rows and 2 columns of loss data."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
})
```

### Response shape
```typescript
{
  requestId: string;
  analysis: TriangleInsight;
  persistence: { status: "stored" | "skipped" | "failed"; reason?: string };
  processingTimeMs: number;
}
```

### Validation gate
After service call, check `summary.warnings` for any critical parse failures. If the triangle could not be parsed at all (< 2 AY × 2 periods), return 400 with a clear message.

### Audit stages
- `request_received`
- `validation_failed` — if Zod or triangle parse fails
- `analysis_completed` — with `totalIbnr`, `reservingBand`, `confidence`, `persistenceStatus`
- `analysis_failed` — on unexpected error

### Timeout pattern
Wrap analysis and Supabase calls with `withTimeout()` — 3000ms for analysis, 2500ms for persistence, 1500ms for audit.

---

## 7. Database (`db/init_lossratiotriangulator.sql`)

```sql
create schema if not exists app_lossratiotriangulator;

create table if not exists app_lossratiotriangulator.app_lossratiotriangulator_analysis_runs (
  id              bigint generated always as identity primary key,
  request_id      uuid not null,
  source_label    text,
  triangle_text   text not null,
  question        text,
  summary         jsonb,
  triangle        jsonb,
  ldfs            jsonb,
  results         jsonb,
  methodology     jsonb,
  audit_notes     jsonb,
  raw_analysis    jsonb,
  created_at      timestamptz not null default now()
);
create index on app_lossratiotriangulator.app_lossratiotriangulator_analysis_runs (created_at desc);

create table if not exists app_lossratiotriangulator.app_lossratiotriangulator_audit (
  id         bigint generated always as identity primary key,
  request_id uuid not null,
  stage      text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index on app_lossratiotriangulator.app_lossratiotriangulator_audit (created_at desc);

-- Grant privileges
grant usage on schema app_lossratiotriangulator to anon, authenticated, service_role;
grant all on all tables in schema app_lossratiotriangulator to service_role;
grant select on all tables in schema app_lossratiotriangulator to anon, authenticated;
alter default privileges in schema app_lossratiotriangulator
  grant all on tables to service_role;
alter default privileges in schema app_lossratiotriangulator
  grant select on tables to anon, authenticated;
```

---

## 8. UI Design (`src/app/page.tsx`)

### 8.1 App identity
- **App name:** Reserving Intelligence Capstone
- **Subtitle:** Loss Ratio Triangulator — Chain-Ladder Method
- **Accent colour:** Indigo/violet family (`indigo-600`, `violet-500`) — distinct from teal (used in other apps), reinforces the finance/actuarial positioning
- **Logo motif:** A triangle/delta shape with a vertical bar (representing development projection) — unique in the logo set

### 8.2 Layout — Intake (before analysis)

Side-by-side symmetric split pane on desktop, stacked on mobile:

**Left pane — Source metadata**
- Source label text input (optional)
- Sample selector dropdown (3 samples)
- Optional: `tail_factor=` override hint text below the selector
- Optional question input

**Right pane — Triangle data**
- Large monospace textarea for CSV/text paste
- Placeholder showing the expected format:
  ```
  AY,12,24,36,48,60
  2020,1200,2150,2580,...
  ```
- Character count / row detection hint below (e.g. "5 rows × 5 columns detected")

**Run button** — full-width below both panes, `indigo-600` background

### 8.3 Layout — Results (after analysis)

Four sections rendered in order:

#### Section 1 — Summary Card (visual-first, same height/width as intake)

Left side:
- **Reserving band badge** (colour-coded):
  - `adequate` → emerald badge: "ADEQUATE"
  - `watch` → amber badge: "WATCH"
  - `strengthening-required` → red badge: "STRENGTHENING REQUIRED"
- Confidence dot + label (high/medium/low)
- Secondary text: "{N} accident years · {M} development periods · {inputType}"

Right side — 3 key metric tiles inline:
- **Total IBNR** — large number, `£{totalIbnr}` formatted with commas
- **IBNR / Paid** — `{ibnrToPaidRatio×100}%`, coloured amber if > 25%, red if > 40%
- **Completeness** — `{completenessPct}%` with mini progress bar

Below the tiles — warnings strip (amber background, each warning as a bullet, only shown if warnings.length > 0)

#### Section 2 — Cumulative Triangle Table

Full-width card with horizontal scroll on mobile.

Table structure:
- Header row: `AY` | `12m` | `24m` | `36m` | `48m` | `60m` | ... | `Ultimate`
- Data rows: one per accident year
- Cell colouring by maturity:
  - **Observed cells** (upper-left triangle): white background, dark text, no decoration
  - **Projected cells** (lower-right triangle, extension to ultimate): `indigo-50` background, italic text, lighter weight — visually distinct from observed data
  - **Latest diagonal cell** per row: `indigo-100` background, semibold — the "as-at" anchor
  - **Null/empty cells**: `slate-50` background, `—` placeholder
- Last column `Ultimate`: always `violet-50` background, bold text
- Row footer: `% Dev` column showing `{pctDeveloped}%` with a thin progress bar fill
- Table caption: "Cumulative paid losses (£000s) · Projected cells shown in italics"

#### Section 3 — Development Factors Panel

Two-column layout:

**Left — LDF table**
| Period | Wtd Avg LDF | Data Pairs | Selected |
|--------|-------------|------------|---------|
| 12→24 | 1.8420 | 4 | 1.8420 |
| 24→36 | 1.2105 | 3 | 1.2105 |
| ... | ... | ... | ... |
| Tail | 1.0000 | — | 1.0000 |

Rows with `dataPoints = 1` shown with amber warning dot.

**Right — IBNR per accident year table**
| AY | Paid (Latest) | Ultimate | IBNR | % Dev |
|----|---------------|----------|------|-------|
| 2019 | 2,780 | 2,812 | 32 | 98.9% |
| ... |
| **Total** | **bold** | **bold** | **bold** | |

IBNR column: colour-coded red if IBNR > 20% of ultimate for that AY.

#### Section 4 — Methodology & Audit Trail

Two cards side-by-side on desktop:

**Methodology** (left):
- Each `methodology[]` line in a rounded bordered box, indigo left-border accent
- Heading: "Chain-Ladder Methodology"

**Audit Notes** (right):
- Each `auditNotes[]` line as a bullet
- Heading: "Computation Audit Trail"
- Subtext: "Reviewable LDF selection log"

Whitespace extraction table below both cards — standard project pattern:
- Columns: Field | Extracted Value | Status
- Status badges: `EXTRACTED` (emerald), `MISSING` (red), `INFERRED` (slate)

---

## 9. Sample Data (`src/lib/demo-samples.ts`)

### Sample 1: `mature-triangle` — Motor / Property (mature, high completeness)
```
AY,12,24,36,48,60
2019,3150,5520,6810,7420,7680
2020,3380,5910,7240,7850
2021,2980,5220,6490
2022,3240,5670
2023,3090
```
- Expected: reservingBand = "adequate", confidence = "high"
- Total IBNR relatively small (mature triangle)
- Clean demonstration of the full triangle with all LDFs computable

### Sample 2: `immature-triangle` — Casualty / Liability (long-tail, low development)
```
AY,12,24,36
2021,1850,3920,5240
2022,2100,4380
2023,1970
tail_factor=1.12
```
- Expected: reservingBand = "strengthening-required", confidence = "medium"
- Tail factor provided
- Short development history — high IBNR relative to paid
- Demonstrates tail factor application and warnings about short development

### Sample 3: `sparse-triangle` — Mixed lines (sparse cells, some nulls)
```
AY,12,24,36,48,60
2018,4200,7100,8640,9100,9250
2019,3800,6500,7980
2020,,5800,7200
2021,4100
2022,3600
```
- Expected: reservingBand = "watch", confidence = "low"
- Missing cell in 2020/12m position
- Demonstrates handling of null cells, warning for single-data-point LDF transitions
- Source label: `sparse-mixed-portfolio.csv`

---

## 10. Tests

### `tests/analyze-triangle.test.ts`

**Test 1 — mature triangle produces correct IBNR:**
- Input: Sample 1 text
- Assert: `summary.reservingBand === "adequate"`
- Assert: `summary.confidence === "high"`
- Assert: `results.length === 5` (5 accident years)
- Assert: `results[0].isProjected === false` (2019 fully developed)
- Assert: `results[4].pctDeveloped < 50` (2023 immature)
- Assert: `summary.totalIbnr > 0`
- Assert: `ldfs.length >= 4` (4 transitions for 5 dev periods)
- Assert: `ldfs[0].weightedAvgFactor > 1.0` (LDFs must be ≥ 1)

**Test 2 — tail factor is applied:**
- Input: Sample 2 text (includes `tail_factor=1.12`)
- Assert: `summary.tailFactor === 1.12`
- Assert: `results` every `ultimateEstimate > latestDiagonal`
- Assert: `summary.warnings` includes tail-uncertainty warning

**Test 3 — sparse triangle produces low confidence:**
- Input: Sample 3 text
- Assert: `summary.confidence === "low"` OR `"medium"`
- Assert: `summary.warnings.length > 0`
- Assert: `summary.completenessPct < 90`

**Test 4 — incremental input is auto-cumulated:**
- Input: a 3×3 incremental triangle (known expected cumulative values)
- Assert: `triangle.inputType === "incremental"`
- Assert: cumulative cells match expected values exactly

**Test 5 — invalid/empty input returns early:**
- Input: `"AY,12\n2023,abc"` (non-numeric)
- Assert: service returns warnings or throws in a controlled way

### `tests/analyze-route.test.ts`

**Test 1 — returns 200 for valid triangle:**
- POST with Sample 1 text
- Assert: `response.status === 200`
- Assert: `json.analysis.summary.totalIbnr > 0`
- Assert: `json.analysis.summary.reservingBand` is one of the valid bands
- Assert: `json.processingTimeMs >= 0`

**Test 2 — returns 400 for too-short input:**
- POST with `triangleText: "x"` (< 30 chars)
- Assert: `response.status === 400`

**Test 3 — allows missing optional fields (question, sourceLabel):**
- POST without `question` or `sourceLabel`
- Assert: `response.status === 200`

---

## 11. Logo (`src/components/loss-ratio-triangulator-logo.tsx`)

SVG motif: a downward-pointing triangle (Δ) with a dashed vertical line extending beyond the baseline — represents the projection from the observed triangle to ultimate. Use `indigo-600` fill for the solid triangle, `violet-400` dashed line for the projection. Square viewBox, rounded container, consistent with other logos in the set.

Add entry to `packages/common-ui/src/logos.tsx`:
```typescript
export { LossRatioTriangulatorLogo } from "../../apps/loss-ratio-triangulator/src/components/loss-ratio-triangulator-logo";
```

---

## 12. `vercel.json`

```json
{
  "installCommand": "pnpm install --frozen-lockfile --dir ../..",
  "buildCommand": "pnpm --dir ../.. --filter @ai-ops/loss-ratio-triangulator build"
}
```

---

## 13. `package.json`

```json
{
  "name": "@ai-ops/loss-ratio-triangulator",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3030",
    "build": "next build",
    "start": "next start --port 3030",
    "lint": "pnpm exec eslint .",
    "typecheck": "tsc --project tsconfig.json",
    "test": "vitest run"
  }
}
```

---

## 14. Quality Gates (mandatory before marking complete)

Run in order:

```sh
# Unit and integration tests
pnpm --filter @ai-ops/loss-ratio-triangulator test

# Static analysis
pnpm --filter @ai-ops/loss-ratio-triangulator lint
pnpm --filter @ai-ops/loss-ratio-triangulator typecheck

# Production build
pnpm --filter @ai-ops/loss-ratio-triangulator build

# QA contract scripts
node scripts/qa/verify-app-tests.mjs loss-ratio-triangulator
VERIFY_TIMEOUT_COVERAGE=1 node scripts/qa/verify-app-tests.mjs loss-ratio-triangulator
node scripts/qa/check-sample-diversity.mjs loss-ratio-triangulator
node scripts/qa/check-status-dot-contract.mjs loss-ratio-triangulator

# Visual smoke
bash scripts/qa/run-app-visual.sh loss-ratio-triangulator @ai-ops/loss-ratio-triangulator 3030
```

All gates must pass before the app is marked complete.

---

## 15. Definition of Done

- [ ] Triangle CSV parsing handles cumulative, incremental, header/no-header, null cells, and `tail_factor=` override
- [ ] Chain-Ladder LDFs computed correctly (volume-weighted, minimum 1 data point)
- [ ] Ultimate estimates and IBNR correct for all 3 sample scenarios
- [ ] `summary.reservingBand` is deterministic and matches expected values for samples 1–3
- [ ] `summary.confidence` is deterministic and matches expected values
- [ ] Warnings are emitted for: short tail, sparse LDF data points, highly immature accident years
- [ ] Cumulative triangle table renders with observed / projected / latest-diagonal cell styling
- [ ] IBNR per-year table renders with colour-coded IBNR column
- [ ] LDF table renders with data-pair count and amber dot for volatile factors
- [ ] Methodology narrative and audit trail render correctly
- [ ] Whitespace extraction table renders with `EXTRACTED` / `INFERRED` / `MISSING` badges
- [ ] All 5 service tests pass
- [ ] All 3 route tests pass
- [ ] Lint, typecheck, build all pass
- [ ] All QA contract scripts pass
- [ ] Supabase schema initialised and persistence returns `stored` on a live run
- [ ] Audit rows written for `request_received` and `analysis_completed`
- [ ] Desktop and mobile screenshots captured
- [ ] `docs/day30_loss-ratio-triangulator_changes.md` written
- [ ] `docs/day-30-execution-plan.md` updated to reflect this replacement
- [ ] RAG sync completed

---

## 16. Acceptance Criteria (summary)

| # | Criterion | Pass condition |
|---|-----------|----------------|
| 1 | Parse cumulative triangle | All 3 samples parse without error |
| 2 | Parse incremental triangle | Cells are correctly cumulated |
| 3 | LDF computation | Volume-weighted, ≥ 1 data point per transition |
| 4 | Ultimate estimates | ultimateEstimate ≥ latestDiagonal for all AYs |
| 5 | IBNR arithmetic | ibnr = ultimateEstimate − latestDiagonal (to £1 precision) |
| 6 | Tail factor | Applied to last LDF when provided via `tail_factor=` |
| 7 | Reserving band | Deterministic from ibnrToPaidRatio + pctDeveloped |
| 8 | Confidence | Deterministic from completeness + LDF data-point counts |
| 9 | Warnings | All 5 warning conditions emit when triggered |
| 10 | Triangle table | Observed vs projected cells visually distinct |
| 11 | IBNR table | Per-year rows correct; totals match summary |
| 12 | LDF table | Volatile factors (dataPoints=1) flagged amber |
| 13 | API contract | 200 on valid, 400 on insufficient input |
| 14 | Persistence | `stored` or `skipped` (never silent failure) |
| 15 | Audit | 3 audit stages written per request |
| 16 | All tests pass | 5 service + 3 route tests green |
| 17 | All gates pass | lint + typecheck + build + QA scripts + visual smoke |

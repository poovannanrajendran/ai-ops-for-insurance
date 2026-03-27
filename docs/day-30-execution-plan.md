# Day 30 Execution Plan — Loss Ratio Triangulator
## Reserving Intelligence Capstone

**Replaces:** challenge-portfolio-showcase (original Day 30)
**Full requirements:** `docs/day30_loss-ratio-triangulator_requirements.md`

## Objective
Deliver a deterministic reserving engine that applies the Chain-Ladder method to a user-supplied loss development triangle, producing IBNR estimates, LDF tables, and an audit-ready methodology narrative.

## Scope
- CSV triangle paste intake (cumulative or incremental, auto-detected)
- Volume-weighted LDF calculation per development period transition
- Optional tail factor input
- Chain-Ladder projection to ultimate per accident year
- IBNR = Ultimate − Latest diagonal (per AY and total)
- Reserving band: adequate / watch / strengthening-required
- Confidence: high / medium / low (based on triangle completeness and LDF stability)
- Whitespace extraction table
- Persistence to Supabase runs + audit tables

## Data Model
Schema: `app_lossratiotriangulator`

Tables:
- `app_lossratiotriangulator_analysis_runs`
- `app_lossratiotriangulator_audit`

Key persisted fields:
- `summary` (totalIbnr, reservingBand, confidence, completenessPct, warnings)
- `triangle` (accidentYears, devPeriods, cells, inputType)
- `ldfs` (weightedAvgFactor, selectedFactor, dataPoints per transition)
- `results` (per accident-year: latestDiagonal, ultimate, ibnr, pctDeveloped)
- `methodology`, `audit_notes`, `raw_analysis`

## Service Logic
- Parse CSV/text triangle → detect cumulative vs incremental
- Build cumulative triangle (cumulate if incremental)
- Compute volume-weighted average LDF per period transition
- Apply tail factor if provided via `tail_factor=` prefix in input
- Project each accident year to ultimate using product of remaining LDFs
- Derive IBNR per AY and in total
- Determine reserving band and confidence from ibnrToPaidRatio + completeness
- Generate 5 warning conditions (short tail, sparse data points, immature AYs, etc.)
- Generate methodology narrative (3–5 lines) and computation audit notes

## UI
- Accent: indigo/violet family
- Section 1: Summary card — reserving band badge + 3 metric tiles (Total IBNR, IBNR/Paid, Completeness) + warnings strip
- Section 2: Cumulative triangle table — observed cells (white), projected cells (indigo-50, italic), latest diagonal (indigo-100), ultimate column (violet-50)
- Section 3: LDF table (left) + IBNR per accident year table (right)
- Section 4: Methodology card + Audit trail card + Whitespace extraction table

## QA Gates
- Unit tests: 5 (mature triangle, tail factor, sparse triangle, incremental input, invalid input)
- Route tests: 3 (200 valid, 400 short, 200 no optional fields)
- lint, typecheck, build
- verify-app-tests, check-sample-diversity, check-status-dot-contract
- Playwright visual smoke

## Dev Port
3030

## Deployment
- Monorepo Vercel config via app-local `vercel.json`
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

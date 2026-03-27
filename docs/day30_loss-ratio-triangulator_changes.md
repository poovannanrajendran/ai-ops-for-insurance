# Day 30 - Loss Ratio Triangulator - Changes

## Summary
Day 30 was replaced with a deterministic reserving capstone app, **Loss Ratio Triangulator**, focused on cumulative/incremental triangle parsing, chain-ladder projection, and auditable IBNR outputs.

## Implemented
- New app scaffold: `apps/loss-ratio-triangulator`
- New package identity: `@ai-ops/loss-ratio-triangulator`
- New API route: `/api/lossratiotriangulator/analyze`
- New schema contract: `app_lossratiotriangulator`
- Deterministic service in `analyze-triangle.ts`:
  - CSV/header/headerless parsing
  - incremental-to-cumulative conversion
  - weighted LDF calculation
  - optional `tail_factor=` support
  - ultimate + IBNR projection by accident year
  - reserving band + confidence + warning generation
- Full UI for intake, summary, warnings, LDF table, AY projection table, methodology, audit notes, and whitespace extraction table
- Supabase persistence and audit insert paths
- Test coverage:
  - service tests (`analyze-triangle.test.ts`)
  - route tests (`analyze-route.test.ts`)

## Samples
- `mature-motor-triangle.csv`
- `long-tail-casualty.csv`
- `sparse-mixed-triangle.csv`

## Bonus Reclassification
- Existing `challenge-portfolio-showcase` retained as a **Bonus** app (no technical rename applied).
- Portfolio/inventory docs updated so Day 30 now points to Loss Ratio Triangulator.

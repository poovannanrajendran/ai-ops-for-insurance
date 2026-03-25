# Day 16 Execution Plan

## Target
- App: `apps/exposure-scenario-modeller`
- Short name: `exposurescenario`
- Schema: `app_exposurescenario`
- Port: `3016`

## Scope delivered
- Deterministic scenario modelling engine with baseline and stressed scenarios.
- Required-field gate before modelling.
- Concentration insights and analyst query snippets.
- Zod-validated route with persistence status handling and non-blocking audit writes.
- Symmetric intake/result UI with shared visual conventions and status dots.
- Unit and route tests covering success and 400 failure paths.
- Samples, `SOURCES.md`, README, and schema bootstrap SQL.

## Shared-file follow-ups
- Add `exposureScenarioModellerApp` to `packages/config/src/apps.ts` and export it through `packages/config/src/index.ts` when shared-file changes are allowed.
- Add a shared `ExposureScenarioLogo` to `packages/common-ui` if the design should be reused across apps.
- Add root deploy wiring for Day 16 when release coordination is ready.

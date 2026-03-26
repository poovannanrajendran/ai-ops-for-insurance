# Day 25 Execution Plan — Sanctions Screening Aid

## Objective
Build deterministic sanctions proximity screening for pre-bind controls using structured entity inputs and fixed watchlist checks.

## Scope
- Required-field entity gate
- Deterministic list matching and similarity scoring
- Block/review/clear decision state
- Action memo and query snippets
- Supabase persistence plus audit events
- Unit/route tests and Playwright visual contract compliance

## Delivery artefacts
- App: `apps/sanctions-screening-aid`
- DB bootstrap: `apps/sanctions-screening-aid/db/init_sanctionsscreening.sql`
- Day notes: `docs/day25_sanctions-screening-aid_changes.md`

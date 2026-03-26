# Day 29 Execution Plan - Insurance AI Readiness Scorer

## Objective
Build a deterministic readiness scoring tool that converts structured operating-model assessments into a readiness score, maturity band, blockers, and a ninety-day plan.

## Scope
- Ingest key-value readiness assessment text via upload/paste/sample.
- Enforce required-field gate for core assessment fields.
- Compute deterministic readiness score and maturity band.
- Surface strengths, blockers, prompt hits, and ninety-day action plan.
- Persist run + audit records into Supabase schema `app_aireadiness`.

## Data model
- `apps/insurance-ai-readiness-scorer/db/init_aireadiness.sql`
- Tables:
  - `app_aireadiness_runs`
  - `app_aireadiness_audit`

## Quality gates
- `pnpm --filter @ai-ops/insurance-ai-readiness-scorer test`
- `pnpm --filter @ai-ops/insurance-ai-readiness-scorer lint`
- `pnpm --filter @ai-ops/insurance-ai-readiness-scorer typecheck`
- `pnpm --filter @ai-ops/insurance-ai-readiness-scorer build`
- `node scripts/qa/verify-app-tests.mjs insurance-ai-readiness-scorer`
- `node scripts/qa/check-sample-diversity.mjs insurance-ai-readiness-scorer`
- `node scripts/qa/check-status-dot-contract.mjs insurance-ai-readiness-scorer`
- `./scripts/qa/run-app-visual.sh insurance-ai-readiness-scorer @ai-ops/insurance-ai-readiness-scorer 3029`

# Day 30 Execution Plan - Challenge Portfolio Showcase

## Objective
Deliver a final, deterministic portfolio showcase app that consolidates Day 1-29 outcomes into a decision-ready narrative, readiness score, and next-action plan.

## Scope
- Intake: structured challenge summary payload (text/file)
- Deterministic parser for key/value evidence blocks
- Showcase scoring model with explicit gates
- Whitespace extraction table with `EXTRACTED` / `MISSING`
- Persistence to Supabase run + audit tables
- Query prompt snippet matching
- Production-ready UI aligned to project design system

## Data Model
Schema: `app_portfolioshowcase`

Tables:
- `app_portfolioshowcase_runs`
- `app_portfolioshowcase_audit`

Key persisted fields:
- `showcase_score`, `showcase_band`, `completeness_pct`, `confidence`
- `strengths`, `blockers`, `next_actions`, `prompt_hits`
- `status`, `request_id`, `processing_ms`

## Service Logic
- Parse line-based key/value pairs
- Required-field gate checks for core publication evidence
- Compute maturity score + band:
  - `Ready`
  - `Needs review`
  - `Blocked`
- Generate deterministic strengths/blockers/next actions
- Generate prompt token hit snippets for reviewer traceability

## QA Gates
App checks:
- unit tests (service + route)
- lint
- typecheck
- build

Repository checks:
- `verify-app-tests`
- `check-sample-diversity`
- `check-status-dot-contract`
- Playwright visual smoke

## Lessons Applied
- Single-source deterministic extraction over opaque heuristics
- Status-dot semantic consistency (green/amber/red)
- Full-width whitespace extraction pattern retained
- Source label normalisation to avoid UI/test selector regressions
- Maintain intake symmetry and border discipline

## Deployment
- Monorepo Vercel config via app-local `vercel.json`
- CLI deployment supported for hobby plan project-link limits
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

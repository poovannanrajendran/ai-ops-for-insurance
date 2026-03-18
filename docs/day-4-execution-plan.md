# Day 4 Execution Plan - slip-reviewer

Date: 2026-03-17
Source: docs/30-topics-30-day-challenge-roadmap-v4-final.pdf (extracted markdown)

## Day 4 Topic (from roadmap)
- App: `slip-reviewer`
- Goal: Paste/upload Lloyd's MRC slip, produce AI-assisted summary with key terms, unusual clauses, and coverage gaps.

## Objective
Build a production-ready Day 4 app with deterministic extraction and review guardrails, consistent with Day 1-3 patterns.

## Scope (MVP)
- Input: paste text + `.txt` + `.pdf`
- API: `/api/slipreviewer/analyze`
- Output:
  - slip summary
  - extracted key terms
  - unusual clause flags (severity + rationale)
  - coverage gap flags (severity + rationale)
  - reviewer actions
- Persistence: optional Supabase store in schema `app_slipreviewer`

## Required-field gate
Minimum required fields for a valid review run:
- `insured_name`
- `inception_date`
- `expiry_date`
- `limit`
- `currency`

## Data contract (v1)
Structured fields:
- `insured_name`
- `broker`
- `territory`
- `inception_date`
- `expiry_date`
- `limit`
- `currency`
- `deductible`
- `sublimits`
- `governing_law`
- `jurisdiction`
- `claims_notification`
- `key_exclusions[]`
- `subjectivities[]`

Review outputs:
- `unusual_clauses[]` with severity (`high|medium`)
- `coverage_gaps[]` with severity (`high|medium`)
- `commentary` (summary, observations, actions)

## Implementation phases
1. Scaffold app
- Create `apps/slip-reviewer` from Day 3 baseline
- Register app in shared config and logos

2. Core service
- Implement deterministic parser + rules engine in `src/services/analyze-slip.ts`
- Add query-hit matching helper

3. API route
- Build `src/app/api/slipreviewer/analyze/route.ts`
- Validate request and enforce required-field gate
- Persist result when Supabase creds are present

4. UI
- Build symmetric intake UI
- Add summary/flags/field table cards
- Add sample selectors and upload handling

5. Database
- Add `db/init_slipreviewer.sql` with schema/table/index/grants/default privileges

6. Tests and verification
- Unit tests for parser and rules
- Route tests for happy path + missing required fields
- Run lint/test/typecheck/build
- Local visual validation (desktop + mobile)

7. Deploy and sync
- Deploy to dedicated Vercel project
- Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Update README/handoff/lessons, sync Linear/Notion/RAG

## Acceptance criteria
- Day 4 app runs locally and in production
- Required-field gate works with explicit warning
- Unusual clauses and coverage gaps are surfaced with rationale
- Persistence status visible and functional
- All quality gates pass

## Implementation status (2026-03-17)
- `apps/slip-reviewer` scaffolded and functional.
- `/api/slipreviewer/analyze` implemented with required-field gate and optional Supabase persistence.
- Public-source sample set and attribution added under `apps/slip-reviewer/samples`.
- Verified locally with `lint`, `test`, `typecheck`, `build`, API smoke checks, and desktop/mobile visual captures.
- Production deployment step remains pending.

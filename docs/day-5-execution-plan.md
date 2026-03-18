# Day 5 Execution Plan - class-of-business-classifier

Date: 2026-03-18
Source: docs/30-topics-30-day-challenge-roadmap-v4-final.md

## Day 5 Topic (from roadmap)
- App: `class-of-business-classifier`
- Goal: Enter free-text risk description and return suggested Lloyd's class-of-business with confidence and reasoning.

## Objective
Build a production-ready Day 5 app that classifies underwriting submissions into class-of-business labels with deterministic guardrails, clear explanation, and auditable persistence.

## Scope (MVP)
- Input:
  - pasted free-text risk description
  - optional `.txt` and `.pdf` upload
  - optional broker/territory/currency hints
- API:
  - `POST /api/classofbusiness/analyze`
- Output:
  - predicted class label (top pick)
  - ranked alternatives (top N)
  - confidence score per candidate
  - feature-based rationale (why this label)
  - referral warnings when confidence is low or conflicting
- Persistence:
  - optional Supabase store in schema `app_classofbusiness`

## Proposed labels (v1)
- Property
- Marine Cargo
- Casualty / Liability
- Cyber
- Financial Lines
- Aviation
- Energy
- Construction
- Accident & Health
- Specialty Other

## Classification guardrails
- Minimum input length gate for meaningful inference.
- Confidence bands:
  - high: `>= 0.80`
  - medium: `0.60 - 0.79`
  - low: `< 0.60` (trigger referral warning)
- Conflict detection:
  - if top two labels are close (delta `< 0.08`), mark as ambiguous and require review.
- Deterministic keyword signals should be surfaced in rationale even when model output is used.

## Data contract (v1)
Request:
- `riskText` (required)
- `sourceLabel` (optional)
- `hints` (optional object: territory, currency, broker)

Response:
- `requestId`
- `analysis`:
  - `topLabel`
  - `topConfidence`
  - `candidates[]` (`label`, `confidence`, `reasoning`)
  - `keywordSignals[]`
  - `warnings[]`
  - `commentary` (`executiveSummary`, `observations[]`, `actions[]`)
- `persistence` (`stored|skipped|failed`, optional reason)
- `processingTimeMs`

## Database plan
Create `apps/class-of-business-classifier/db/init_classofbusiness.sql`:
- `app_classofbusiness.app_classofbusiness_analysis_runs`
- `app_classofbusiness.app_classofbusiness_audit`
- required indexes, grants, and default privileges (same standard as Day 2-4)

## UI/UX plan
- Keep intake layout symmetric from first commit:
  - left: source/upload panel
  - right: risk text panel
  - aligned top labels and equal visual rhythm
- Preserve Day 4 visual language:
  - consistent card spacing, border weight, typography hierarchy
  - no nested input boxes that create double-border confusion
- Include sample chips:
  - clear single-class example
  - ambiguous multi-signal example
  - missing-data/short-text gate example

## Implementation phases
1. Scaffold app
- Create `apps/class-of-business-classifier` from Day 4 baseline.
- Register app config + logo in shared packages.

2. Core service
- Implement `src/services/analyze-class-of-business.ts`.
- Add deterministic keyword signal extractor.
- Add scoring + ambiguity rules.

3. API route
- Implement `src/app/api/classofbusiness/analyze/route.ts`.
- Validate payload and enforce minimum input gate.
- Write non-blocking audit stages:
  - `request_received`
  - `analysis_completed`
  - `validation_failed` / `analysis_failed`

4. UI
- Build symmetric intake and results panels.
- Show top class, confidence badge, ranked alternatives, rationale, warnings.

5. Database
- Add init SQL with analysis + audit tables.

6. Tests and verification
- Unit tests:
  - keyword extraction
  - confidence banding
  - ambiguity warning behavior
- Route tests:
  - happy path
  - short-input gate
  - persistence stored/skipped/failed
- Run:
  - `lint`
  - `test`
  - `typecheck`
  - `build`
- Visual QA:
  - desktop + mobile screenshots
  - symmetry check on intake panels

7. Deploy and sync
- Deploy to dedicated Vercel project.
- Ensure project root directory is `apps/class-of-business-classifier`.
- Configure production env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Update docs:
  - README
  - handoff
  - lessons learned
  - RAG memory/guardrails sync

## Acceptance criteria
- Day 5 app runs locally and in production.
- Class prediction + alternatives + confidence are returned for valid input.
- Low-confidence and ambiguous cases raise explicit warnings.
- Analysis and audit writes are visible in Supabase.
- UI intake panels are visually aligned and symmetric.
- All quality gates pass.

## Execution status (2026-03-18)
- Planning complete.
- Implementation not started.

# Day 29 - Insurance AI Readiness Scorer (Changes)

## Added
- New app scaffold: `apps/insurance-ai-readiness-scorer`
- Deterministic AI readiness scoring service with:
  - required-field extraction table
  - readiness score and maturity band
  - strengths, blockers, and ninety-day plan outputs
  - prompt token hit extraction
- API route: `POST /api/aireadiness/analyze`
- Supabase persistence + audit logging in schema `app_aireadiness`
- Sample packs for scaling, foundational-gap, and missing-field scenarios

## UI and UX
- Day-pattern aligned layout with status dots and split intake pane
- Full-width whitespace wording table with extracted/missing status
- Separate cards for summary, query snippets, strengths, blockers, and ninety-day plan

## QA
- Unit tests for service and route
- Shared checklist scripts passed:
  - test presence check
  - sample diversity check
  - status-dot contract
- Playwright visual contract and regression checks passed

# Day 20 Execution Plan

## Scope
- Build `apps/regulatory-update-digest`
- Short name: `regulatorydigest`
- Schema: `app_regulatorydigest`
- Port: `3020`

## Day 20 Topic (from roadmap)
- App: `regulatory-update-digest`
- Summary: Lloyd's/PRA/FCA feed digest with class relevance, warning flags, and action recommendations.
- Bucket: General Insurance / Compliance

## Delivery plan
1. Build deterministic feed parser for bulletin blocks with required fields.
2. Implement relevance scoring by class focus and urgency signal tokens.
3. Add API route with Zod validation, gate handling, timeout guard, persistence semantics, and audit stages.
4. Build symmetric intake UI with sample buttons, digest summary, warning board, ledger, and whitespace table.
5. Add positive/negative analyzer tests and route tests (`200`/`400`, timeout marker).
6. Add SQL bootstrap, sample files, and provenance notes.
7. Run lint/test/typecheck/build and QA contract checks.

## Notes
- Persistence statuses: `stored`, `skipped`, `failed`.
- Audit stages: `request_received`, `validation_failed`, `analysis_completed`, `analysis_failed`.

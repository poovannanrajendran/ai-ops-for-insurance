# Day 19 Execution Plan

## Scope
- Build `apps/wording-risk-diff-checker`
- Short name: `wordingriskdiff`
- Schema: `app_wordingriskdiff`
- Port: `3019`

## Delivery plan
1. Scaffold a standalone Next.js app under the owned path with local app constants so no shared config edits are required.
2. Implement a deterministic clause parser and diff engine focused on risk-impact deltas:
   - added clauses
   - removed clauses
   - changed clauses
   - severity tags and risk category tags
3. Add `POST /api/wordingriskdiff/analyze` with Zod validation, explicit required gate behavior, persistence status semantics, and non-blocking audit inserts.
4. Build a symmetric UI matching the house style with status icon dots and a clause ledger.
5. Add positive and negative service and route tests, including `200` and `400` cases.
6. Add SQL bootstrap, samples, provenance notes, and README.
7. Run `lint`, `test`, `typecheck`, and `build`; record outcomes for handoff.

## Implementation notes
- Persistence statuses are `stored`, `skipped`, and `failed`.
- Audit stages are `request_received`, `validation_failed`, `analysis_completed`, and `analysis_failed`.
- Sample wording is synthetic to avoid provenance ambiguity and shared-content issues.

# Day 20 - Regulatory Update Digest - Changes

Date: 2026-03-25

## Delivered
- Added new app: `apps/regulatory-update-digest`.
- Implemented deterministic regulatory feed parsing and class-relevance scoring.
- Added severity-tagged update ledger, priority alerts, governance action board, and full-width whitespace table.
- Added API contract with request validation, timeout guard, and persistence semantics.
- Added non-blocking audit logging stages for success/failure paths.
- Added Supabase init SQL and public-domain source provenance notes.
- Added unit/service tests and route tests with positive/negative paths.

## Required ops
- Run: `apps/regulatory-update-digest/db/init_regulatorydigest.sql`
- Expose schema in Supabase Data API: `app_regulatorydigest`
- Set env vars in runtime: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## QA notes
- Includes green/amber/red status semantics in header storage state.
- Includes sample diversity with 3 scenario variants.
- Route tests include explicit `200` and `400` contract checks.

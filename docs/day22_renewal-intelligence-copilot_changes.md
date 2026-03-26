# Day 22 - Renewal Intelligence Copilot - Changes

Date: 2026-03-26

## Delivered
- Added new app: `apps/renewal-intelligence-copilot`.
- Implemented deterministic renewal parser and pricing-signal strategy logic.
- Added strategy memo, talking points, signal cards, action plan, and whitespace table.
- Added API route with validation, timeout guard, persistence semantics, and non-blocking audit stages.
- Added Supabase init SQL, sample files, and source notes.
- Added positive/negative service tests and route tests (`200`/`400`).

## Required ops
- Run: `apps/renewal-intelligence-copilot/db/init_renewalcopilot.sql`
- Expose schema in Supabase Data API: `app_renewalcopilot`
- Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

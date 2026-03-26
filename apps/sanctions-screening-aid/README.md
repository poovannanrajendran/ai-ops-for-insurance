# Sanctions Screening Aid (Day 25)

Deterministic sanctions proximity screening for pre-bind controls.

## What it does
- Parses required entity fields from key-value input
- Matches against deterministic watchlist entries using token-overlap similarity
- Produces clear block/review/clear state with supporting rationale
- Persists analysis and audit events to `app_sanctionsscreening`

## Local run
```bash
pnpm --filter @ai-ops/sanctions-screening-aid dev
```

Runs on `http://localhost:3025`.

## Database bootstrap
Run:
- `apps/sanctions-screening-aid/db/init_sanctionsscreening.sql`

Then expose `app_sanctionsscreening` in Supabase Data API schemas.

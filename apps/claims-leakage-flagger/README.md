# Claims Leakage Flagger (Day 14)

## Local dev

```bash
pnpm --filter @ai-ops/claims-leakage-flagger dev
```

## Database bootstrap

Run:

```sql
-- file: apps/claims-leakage-flagger/db/init_claimsleakage.sql
```

Then expose schema in Supabase Data API:
- `app_claimsleakage`

## What it does
- Parses claims bordereaux-style CSV input into deterministic claim records.
- Flags leakage indicators such as late notification, reserve inadequacy, duplicate patterns, and reopened claims.
- Produces prioritised findings, warning commentary, and query-matched snippets for handlers.
- Persists analysis and non-blocking audit stages when Supabase credentials are configured.

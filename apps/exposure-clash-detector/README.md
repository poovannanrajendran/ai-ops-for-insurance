# Exposure Clash Detector (Day 13)

## Local dev

```bash
pnpm --filter @ai-ops/exposure-clash-detector dev
```

## Database bootstrap

Run:

```sql
-- file: apps/exposure-clash-detector/db/init_exposureclash.sql
```

Then expose schema in Supabase Data API:
- `app_exposureclash`

## What it does
- Parses multi-schedule exposure CSV inputs.
- Detects cross-schedule overlap clashes by insured, location, peril, and period.
- Ranks clash severity with concentration and warning commentary.
- Persists analysis and non-blocking audit stages when Supabase credentials are configured.

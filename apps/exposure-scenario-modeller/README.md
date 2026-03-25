# Exposure Scenario Modeller (Day 16)

## Local dev

```bash
pnpm --filter @ai-ops/exposure-scenario-modeller dev
```

## Database bootstrap

Run:

```sql
-- file: apps/exposure-scenario-modeller/db/init_exposurescenario.sql
```

Then expose schema in Supabase Data API:
- `app_exposurescenario`

## What it does
- Parses deterministic exposure CSV inputs.
- Applies a required-field gate before modelling.
- Produces baseline and stressed scenario outputs with concentration insights.
- Generates analyst-ready query snippets for drill-down.
- Persists results and non-blocking audit stages when Supabase credentials are configured.

## Required columns
- `exposure_id`
- `account_name`
- `country`
- `peril`
- `segment`
- `tiv_gbp`
- `attachment_gbp`
- `limit_gbp`

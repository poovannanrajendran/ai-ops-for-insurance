# Broker Submission Builder (Day 15)

## Local dev

```bash
pnpm --filter @ai-ops/broker-submission-builder dev
```

## Database bootstrap

Run:

```sql
-- file: apps/broker-submission-builder/db/init_brokersubmission.sql
```

Then expose schema in Supabase Data API:
- `app_brokersubmission`

## What it does
- Parses labelled broker submission notes into deterministic structured fields.
- Applies a required-field gate before generating a market-facing submission build.
- Flags referral triggers, information gaps, and query-matched evidence snippets.
- Persists analysis output and non-blocking audit stages when Supabase credentials are configured.

# Binder Capacity Monitor

Day 11 app for deterministic binder utilization monitoring, forecast threshold checks, concentration review, and delegated authority runway tracking.

## What it does

- parses a binder ledger CSV with strict required-field validation
- computes current used percentage, remaining capacity, and forecast runway
- assigns deterministic green / amber / red threshold bands
- flags low headroom, concentration, current breach, and forecast breach conditions
- surfaces class and territory drilldown metrics plus top-risk positions
- persists analysis runs and non-blocking audit events to Supabase when configured

## Required environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional but recommended for consistency with the rest of the monorepo:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Database bootstrap

Run:

```sql
\i apps/binder-capacity-monitor/db/init_bindercapacity.sql
```

Then expose `app_bindercapacity` in Supabase Data API.

Tables created:

- `app_bindercapacity.app_bindercapacity_analysis_runs`
- `app_bindercapacity.app_bindercapacity_audit`

Audit stages emitted by the API route:

- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

Persistence failure messages are translated into operator-friendly hints for:

- missing schema exposure in Supabase Data API
- missing schema/table/sequence permissions
- bootstrap not yet applied

## Local commands

```sh
pnpm --filter @ai-ops/binder-capacity-monitor dev
pnpm --filter @ai-ops/binder-capacity-monitor lint
pnpm --filter @ai-ops/binder-capacity-monitor typecheck
pnpm --filter @ai-ops/binder-capacity-monitor test
pnpm --filter @ai-ops/binder-capacity-monitor build
```

## Deployment

Use the app folder with Vercel and set:

- Root Directory: `apps/binder-capacity-monitor`
- Framework: `Next.js`
- Install Command: `pnpm install --frozen-lockfile --dir ../..`
- Build Command: `pnpm --dir ../.. --filter @ai-ops/binder-capacity-monitor build`

## Sample data

- `samples/binder-amber-runway.csv`
- `samples/binder-forecast-breach.csv`
- `samples/binder-minimum-gate.csv`
- `samples/SOURCES.md`

## API

- `POST /api/bindercapacity/analyze`

Expected JSON payload:

```json
{
  "csvText": "risk_id,insured_name,...",
  "sourceLabel": "binder-forecast-breach.csv",
  "question": "Will this binder breach on forecast?"
}
```

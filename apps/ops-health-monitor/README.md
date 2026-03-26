# Ops Health Monitor (Day 23)

Deterministic KPI monitoring tool for insurance operations leadership.

## What it does
- Parses KPI CSV input (`kpi,current,target,previous,owner,direction`)
- Scores per-metric anomaly severity (high/medium/low)
- Produces executive narrative, action plan, query matches, and whitespace extraction table
- Persists analysis and audit events to Supabase schema `app_opshealth`

## Local run
```bash
pnpm --filter @ai-ops/ops-health-monitor dev
```

Runs on `http://localhost:3023`.

## Database bootstrap
Run:
- `apps/ops-health-monitor/db/init_opshealth.sql`

Then expose `app_opshealth` in Supabase Data API schemas.

## Tests
```bash
pnpm --filter @ai-ops/ops-health-monitor test
pnpm --filter @ai-ops/ops-health-monitor lint
pnpm --filter @ai-ops/ops-health-monitor typecheck
pnpm --filter @ai-ops/ops-health-monitor build
```

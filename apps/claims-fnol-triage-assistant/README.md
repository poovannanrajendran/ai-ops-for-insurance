# Claims FNOL Triage Assistant

Day 10 app for deterministic first-notice-of-loss triage.
It classifies FNOL notices into `fast-track`, `manual-review`, or `escalate` based on explicit claims rules and produces factor-level rationale.

## Local run

```sh
pnpm --filter @ai-ops/claims-fnol-triage-assistant dev
```

App URL:
- `http://localhost:3010`

## Quality gates

```sh
pnpm --filter @ai-ops/claims-fnol-triage-assistant lint
pnpm --filter @ai-ops/claims-fnol-triage-assistant typecheck
pnpm --filter @ai-ops/claims-fnol-triage-assistant test
pnpm --filter @ai-ops/claims-fnol-triage-assistant build
```

## Environment variables

Set these in repo-root `.env.local` and in Vercel for deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Supabase setup

Run:

```sh
psql "$SUPABASE_DB_URL" -f apps/claims-fnol-triage-assistant/db/init_fnoltriage.sql
```

Or execute [init_fnoltriage.sql](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/apps/claims-fnol-triage-assistant/db/init_fnoltriage.sql) in the Supabase SQL editor.

Then expose schema in Supabase Data API:
- `app_fnoltriage`

Tables created:
- `app_fnoltriage.app_fnoltriage_analysis_runs`
- `app_fnoltriage.app_fnoltriage_audit`

## Audit stages

- `request_received`
- `validation_failed`
- `triage_completed`
- `triage_failed`

## Deploy

```sh
vercel --prod
```

For a dedicated Vercel project, set:
- Root Directory: `apps/claims-fnol-triage-assistant`
- Framework Preset: `Next.js`
- Install Command: `pnpm install --frozen-lockfile --dir ../..`
- Build Command: `pnpm --dir ../.. --filter @ai-ops/claims-fnol-triage-assistant build`

## Samples

Synthetic FNOL notices live in `samples/`.
They are testing fixtures only and contain no real claim records.

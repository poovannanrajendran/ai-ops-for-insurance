# Placement Tracker

Day 18 internal tool for deterministic placement progress tracking.

## What it does

- accepts a CSV market placement extract
- shows placed versus open progress in a smart-follow style view
- tracks market share, projected completion, and weighted capacity progression
- surfaces deterministic priority flags for stale follow-ups, capacity gaps, and lead dependency
- stores analysis and audit events in Supabase when server credentials are available

## Run locally

```bash
pnpm --filter @ai-ops/placement-tracker dev
```

App URL: `http://localhost:3018`

## Validation

```bash
pnpm --filter @ai-ops/placement-tracker lint
pnpm --filter @ai-ops/placement-tracker typecheck
pnpm --filter @ai-ops/placement-tracker test
pnpm --filter @ai-ops/placement-tracker build
```

## Supabase env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Database bootstrap

Run:

- [init_placementtracker.sql](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/apps/placement-tracker/db/init_placementtracker.sql)

Then expose schema `app_placementtracker` in Supabase Data API.

## Tables

- `app_placementtracker.app_placementtracker_analysis_runs`
- `app_placementtracker.app_placementtracker_audit`

## Input format

CSV with required columns:

- `placement_id`
- `account_name`
- `broker`
- `market_name`
- `status`
- `target_share_pct`
- `signed_share_pct`
- `quoted_share_pct`
- `line_size_gbp`
- `premium_gbp`
- `follow_up_age_days`
- `capacity_change_pct`
- `class_of_business`
- `territory`

## Deterministic rules

Priority flags are triggered by explicit thresholds:

- stale follow-up: open market with `5+` days since last touch
- capacity gap: projected share misses target by `5+` points
- shrinking capacity: appetite down by `10%+`
- declined line: declined target share of `10%+`
- lead dependency: one market carries `45%+` of the signed line
- line mismatch: more than one line size appears in the same extract

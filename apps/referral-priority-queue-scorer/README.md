# Referral Priority Queue Scorer

Day 9 internal tool for deterministic underwriting referral ranking.

## What it does

- accepts a TSV referral queue
- scores each referral using explicit weighted factors
- ranks review order
- highlights critical queue warnings
- stores analysis and audit events in Supabase when server credentials are available

## Run locally

```bash
pnpm --filter @ai-ops/referral-priority-queue-scorer dev
```

App URL: `http://localhost:3009`

## Validation

```bash
pnpm --filter @ai-ops/referral-priority-queue-scorer lint
pnpm --filter @ai-ops/referral-priority-queue-scorer typecheck
pnpm --filter @ai-ops/referral-priority-queue-scorer test
pnpm --filter @ai-ops/referral-priority-queue-scorer build
```

## Supabase env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Database bootstrap

Run:

- [init_referralqueuescorer.sql](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/apps/referral-priority-queue-scorer/db/init_referralqueuescorer.sql)

Then expose schema `app_referralqueuescorer` in Supabase Data API.

## Tables

- `app_referralqueuescorer.app_referralqueuescorer_analysis_runs`
- `app_referralqueuescorer.app_referralqueuescorer_audit`

## Input format

TSV with required columns:

- `referral_id`
- `insured_name`
- `class_of_business`
- `territory`
- `quoted_premium_gbp`
- `tiv_gbp`
- `loss_ratio_pct`
- `days_to_inception`
- `missing_fields_count`
- `new_business`
- `claims_activity`
- `sanctions_flag`
- `referral_reason`
- `broker_tier`

## Scoring model

Weighted deterministic factors:

- missing fields: up to `20`
- sanctions flag: `28`
- time pressure: up to `12`
- loss ratio: up to `16`
- TIV: up to `18`
- premium size: up to `6`
- new business: `6`
- claims activity: `8`
- referral reason pattern: up to `18`
- broker tier oversight: up to `4`
- multi-territory scope: up to `8`

Urgency bands:

- `critical`: `70+`
- `high`: `50-69`
- `moderate`: `30-49`
- `routine`: below `30`

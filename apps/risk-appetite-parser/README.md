# Risk Appetite Parser

Day 3 app for the 30-day challenge.

Production URL: `https://risk-appetite-parser.vercel.app`

## Purpose

Accept a risk appetite statement in text or PDF form, extract standard whitespace-tag fields, and surface warnings plus query hits for underwriting review.

## Current scope

- standalone Next.js app under `apps/risk-appetite-parser`
- intake flow for pasted text and uploaded `.txt` or `.pdf` files
- deterministic extraction engine for whitespace standard fields
- minimum required field gate (`class_of_business`, `territory`, `max_line_size`)
- `/api/riskappetite/analyze` route with structured logging and optional Supabase persistence
- query matching over extracted fields
- polished Day 2-derived UI symmetry and warning panels

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/risk-appetite-parser dev
```

The app runs on `http://localhost:3001`.

## Verification

```sh
pnpm --filter @ai-ops/risk-appetite-parser test
pnpm --filter @ai-ops/risk-appetite-parser typecheck
pnpm --filter @ai-ops/risk-appetite-parser build
```

## Sample data

- `samples/balanced-appetite.txt`
- `samples/referral-heavy-appetite.txt`
- `samples/missing-required-fields.txt`

## Database bootstrap

Run `db/init_riskappetite.sql` in Supabase if you want stored analysis runs for the demo.

For Vercel deployment, set these project environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- Keep schema `app_riskappetite` exposed in Supabase Data API.
- Keep grants/default privileges broad for `anon`, `authenticated`, `service_role` for this internal demo workflow.
- Built-in `Missing required data` sample is intentionally long enough to trigger required-field warnings (not input-length validation).

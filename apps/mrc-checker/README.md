# mrc-checker

Day 17 app for the 30-day challenge.

## Purpose

Accept London Market MRC or slip text, run deterministic required-field and clause checks, and return:

- required-field gate status
- field-by-field extraction coverage
- clause presence and attention checks
- warning and referral outputs
- reviewer commentary and query hits
- optional persisted run/audit status semantics

## Current scope

- standalone Next.js app under `apps/mrc-checker`
- intake flow for pasted text and uploaded `.txt` / `.pdf` files
- deterministic checker in `src/services/analyze-mrc.ts`
- Zod-backed request and response contract in `src/types/mrc-checker.ts`
- `/api/mrcchecker/analyze` route with `stored` / `failed` / `skipped` persistence semantics
- non-blocking audit writes to Supabase when credentials are configured
- symmetric Day app UI with status dots for fields, clauses, warnings, and referrals

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/mrc-checker dev
```

The app runs on `http://localhost:3017`.

## Verification

```sh
pnpm --filter @ai-ops/mrc-checker lint
pnpm --filter @ai-ops/mrc-checker test
pnpm --filter @ai-ops/mrc-checker typecheck
pnpm --filter @ai-ops/mrc-checker build
```

## Sample data

- `samples/public-executed-mrc.txt`
- `samples/complete-template-check.txt`
- `samples/missing-required-gate.txt`
- source notes: `samples/SOURCES.md`

## Database bootstrap

Run `db/init_mrcchecker.sql` in Supabase if you want stored analysis runs for demo and QA.

For Vercel deployment, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- Keep schema `app_mrcchecker` exposed in Supabase Data API.
- This app uses local app metadata constants so no shared config changes are required to run it.

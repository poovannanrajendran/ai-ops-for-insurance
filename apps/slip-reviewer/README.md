# Slip Reviewer

Day 4 app for the 30-day challenge.

## Purpose

Accept London Market slip text (or PDF text extraction), parse deterministic key fields, and return:

- required-field gate result
- unusual clause flags with rationale
- coverage gap flags with rationale
- reviewer-focused commentary and query hits

## Current scope

- standalone Next.js app under `apps/slip-reviewer`
- intake flow for pasted text and uploaded `.txt` / `.pdf` files
- deterministic extraction and rule engine in `src/services/analyze-slip.ts`
- required-field gate (`insured_name`, `inception_date`, `expiry_date`, `limit`, `currency`)
- `/api/slipreviewer/analyze` route with optional Supabase persistence
- symmetric Day 3-derived UI layout and Day 4 logo treatment

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/slip-reviewer dev
```

The app runs on `http://localhost:3001`.

## Verification

```sh
pnpm --filter @ai-ops/slip-reviewer test
pnpm --filter @ai-ops/slip-reviewer typecheck
pnpm --filter @ai-ops/slip-reviewer build
```

## Sample data

- `samples/public-howden-ecb-cyber-slip-2025.txt`
- `samples/lmg-mrc-template-aligned.txt`
- `samples/missing-required-gate.txt`
- source attribution notes: `samples/SOURCES.md`

## Database bootstrap

Run `db/init_slipreviewer.sql` in Supabase if you want stored analysis runs for demo and QA.

For Vercel deployment, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- Keep schema `app_slipreviewer` exposed in Supabase Data API.
- Keep grants/default privileges broad for `anon`, `authenticated`, `service_role` for this internal demo workflow.

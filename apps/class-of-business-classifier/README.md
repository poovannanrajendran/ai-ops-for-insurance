# Class of Business Classifier

Day 5 app for the 30-day challenge.

## Purpose

Accept free-text risk descriptions (or uploaded text/PDF extraction), then classify likely Lloyd's class-of-business labels with confidence, alternatives, and rationale.

## Current scope

- standalone Next.js app under `apps/class-of-business-classifier`
- intake flow for pasted text and uploaded `.txt` / `.pdf` files
- deterministic signal-based classifier in `src/services/analyze-class-of-business.ts`
- confidence and ambiguity warnings
- `/api/classofbusiness/analyze` route with optional Supabase persistence and audit logging
- symmetric Day 4-derived intake layout and Day 5 logo treatment

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/class-of-business-classifier dev
```

The app runs on `http://localhost:3005`.

## Verification

```sh
pnpm --filter @ai-ops/class-of-business-classifier test
pnpm --filter @ai-ops/class-of-business-classifier typecheck
pnpm --filter @ai-ops/class-of-business-classifier build
```

## Sample data

- `samples/property-warehouse-risk.txt`
- `samples/mixed-cyber-financial-signals.txt`
- `samples/short-risk-note.txt`
- sample notes: `samples/SOURCES.md`

## Database bootstrap

Run `db/init_classofbusiness.sql` in Supabase to enable stored runs and audit logs.

For Vercel deployment, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- Keep schema `app_classofbusiness` exposed in Supabase Data API.
- Keep grants/default privileges broad for `anon`, `authenticated`, and `service_role` for this internal demo workflow.

# Supabase bootstrap and Data API enablement

This project now includes scripts to automate:

- applying each app's `db/init_*.sql`
- enabling schema exposure for PostgREST/Data API
- verifying Data API access to the app schema

## Prerequisites

Set these environment variables:

- `SUPABASE_DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The scripts auto-load `.env.local` / `.env.symphony.local` via `scripts/load-local-env.sh`.

## Single app bootstrap

```bash
pnpm supabase:bootstrap:schema treaty-structure-explainer
```

Equivalent:

```bash
./scripts/supabase/bootstrap-schema.sh treaty-structure-explainer
```

## All apps bootstrap

```bash
pnpm supabase:bootstrap:all
```

Equivalent:

```bash
./scripts/supabase/bootstrap-all-schemas.sh
```

## What the script does

1. Locates app init SQL in `apps/<slug>/db/init_*.sql`
2. Runs SQL on remote database via `psql`
3. Updates `authenticator` role setting:
   - `pgrst.db_schemas` includes the app schema
4. Sends `notify pgrst, 'reload config'`
5. Verifies access via REST:
   - `Accept-Profile: <app_schema>`
   - fails if `PGRST106` (invalid/non-exposed schema) is returned

## Visual QA checks for Day 12-14

Added automated checks:

- Shared card border unit test
- Playwright visual smoke check for Day 12-14

Run:

```bash
pnpm test:ui:common
pnpm test:visual:day12-14
```

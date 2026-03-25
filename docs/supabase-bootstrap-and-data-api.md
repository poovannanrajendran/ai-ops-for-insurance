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

## Data API exposure checklist for Day 15-19

Use the same bootstrap flow for each of these schemas:

- `app_brokersubmission`
- `app_exposurescenario`
- `app_mrcchecker`
- `app_placementtracker`
- `app_wordingriskdiff`

Checklist:

1. Apply the matching `db/init_*.sql` for the app.
2. Confirm the schema exists in `information_schema.schemata`.
3. Confirm both tables exist:
   - `app_<slug>_analysis_runs`
   - `app_<slug>_audit`
4. Add the schema to `pgrst.db_schemas` for the `authenticator` role.
5. Reload PostgREST with `notify pgrst, 'reload config'`.
6. Verify a REST `select` with `Accept-Profile: <app_schema>` succeeds.
7. Verify the same request fails with `PGRST106` until the schema is exposed.

Suggested verification query pattern:

```sql
select schema_name
from information_schema.schemata
where schema_name in (
  'app_brokersubmission',
  'app_exposurescenario',
  'app_mrcchecker',
  'app_placementtracker',
  'app_wordingriskdiff'
);
```

## Visual QA checks for Day 12-14

Added automated checks:

- Shared card border unit test
- Playwright visual smoke check for Day 12-14

Run:

```bash
pnpm test:ui:common
pnpm test:visual:day12-14
```

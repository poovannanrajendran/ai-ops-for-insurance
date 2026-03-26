# Data Quality Validator (Day 24)

Deterministic schema and value checks for insurance ingestion datasets.

## What it does
- Validates required fields: `record_id,class_of_business,country,premium_gbp,inception_date,expiry_date`
- Detects duplicate IDs, negative premium values, and invalid date sequencing
- Produces issue register, remediation suggestions, and briefing narrative
- Persists analysis and audit events to Supabase schema `app_dataquality`

## Local run
```bash
pnpm --filter @ai-ops/data-quality-validator dev
```

Runs on `http://localhost:3024`.

## Database bootstrap
Run:
- `apps/data-quality-validator/db/init_dataquality.sql`

Then expose `app_dataquality` in Supabase Data API schemas.

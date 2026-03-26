# Day 24 Execution Plan — Data Quality Validator

## Objective
Build a deterministic validator for insurance ingestion datasets that checks required schema, value sanity, and date logic before load.

## Scope
- Required-field and column-gate validation
- Duplicate ID detection and value anomaly checks
- Date ordering checks
- Query snippet matching and remediation suggestions
- Supabase persistence and audit trail
- Unit + route tests and strict visual contract checks

## Delivery artefacts
- App: `apps/data-quality-validator`
- DB bootstrap: `apps/data-quality-validator/db/init_dataquality.sql`
- Day notes: `docs/day24_data-quality-validator_changes.md`

# Day 23 Execution Plan — Ops Health Monitor

## Objective
Build a deterministic operations KPI monitor that ingests structured KPI rows, scores anomaly severity, and produces an executive action briefing.

## Scope
- Deterministic KPI parser and scorer
- Required-field validation gate
- Query-token snippet matching
- Whitespace wording table (Field wording / Extracted value / Status)
- Supabase persistence + audit trail
- Positive/negative tests and timeout-contract coverage
- Visual contract compliance

## Delivery artefacts
- App: `apps/ops-health-monitor`
- DB bootstrap: `db/init_opshealth.sql`
- Day notes: `docs/day23_ops-health-monitor_changes.md`

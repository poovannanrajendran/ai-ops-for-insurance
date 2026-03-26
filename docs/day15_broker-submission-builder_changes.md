# Day 15 - broker-submission-builder_changes

## Original scope
- Deterministic broker submission builder that ingests notes (upload/paste/sample) and surface a market-readiness summary.
- Enforce required-field gating before generating the submission output and highlight referral triggers, gaps, and query evidence.
- Persist structured results and audit events in `app_brokersubmission` schema.

## Enhancements implemented
- Parses labelled broker notes into structured fields (insured, risk, controls, ask, referral cues, etc.) before applying the required-field gate.
- Renders a two-pane intake with sample cards, query prompt, and CTA while surfacing summary, warnings, and referral context for reviewer handoff.
- Persists the `app_brokersubmission_analysis_runs` and writes non-blocking audit stages so downstream workflows can replay or monitor submissions.

## Corrections and fixes
- Bootstrapped `app_brokersubmission` schema, exposed it through the Supabase Data API, and documented the `init_brokersubmission.sql` SQL entrypoint.
- Added status adornments (green/amber/red dots) so UI sections clearly indicate readiness, warnings, or referral blockers.

## Data and audit
- Schema: `app_brokersubmission`
- Tables: `app_brokersubmission_analysis_runs`, `app_brokersubmission_audit`
- Audit stages: `request_received`, `validation_failed`, `analysis_completed`, `analysis_failed`

## Analytics
- Statcounter instrumentation is enabled for production to capture page visits across the day‑15 route.

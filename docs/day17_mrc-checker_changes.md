# Day 17 - mrc-checker_changes

## Original scope
- Accept London Market MRC/slip text, run deterministic required-field + clause checks, and provide review-ready summaries with warning/referral cues.
- Persist analysis and audit events through Supabase schema `app_mrcchecker` and return structured status for automation flows.

## Enhancements implemented
- Provides field coverage, clause presence/attention scoring, and reviewer commentary together with flagged referral and warning outputs.
- Enforces `requestId` persistence semantics (`stored` / `failed` / `skipped`) and surfaces `persistence.status` in every response so clients can track storage outcomes.
- Mirrors the shared Day-app visual language with status dots, intake splits, and query prompt handling for the MRC workflow.

## Corrections and fixes
- Bootstrapped `app_mrcchecker` schema with required tables and exposed the schema through the Supabase Data API for persistence.
- Added consistent status indicators (green/amber/red) on the header to signal readiness, warnings, and persistence across the UI.

## Data and audit
- Schema: `app_mrcchecker`
- Tables: `app_mrcchecker_analysis_runs`, `app_mrcchecker_audit`
- Audit stages: `request_received`, `validation_failed`, `analysis_completed`, `analysis_failed`

## Analytics
- Statcounter tracking is enabled for the Day 17 route to monitor MRC checker adoption and entry patterns.

# Day 13 - exposure-clash-detector_changes

## Original scope
- Detect overlapping exposure clashes across schedules.
- Rank clash severity and concentration risk.

## Enhancements implemented
- New app delivered with:
  - schedule CSV parser and clash logic
  - deterministic severity ranking
  - country/peril concentration output
  - API route with persistence and audit logging
  - tests, samples, README, and DB init script

## Corrections and fixes
- Fixed route test compatibility by mocking `next/server` in Vitest.
- Corrected Vercel settings for successful production deployment.

## Data and audit
- Schema: `app_exposureclash`
- Tables: `app_exposureclash_analysis_runs`, `app_exposureclash_audit`

## Analytics
- Statcounter added in production layout.

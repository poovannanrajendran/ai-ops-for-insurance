# Day 16 - exposure-scenario-modeller_changes

## Original scope
- Build the Exposure Scenario Modeller that ingests CSV exposures, applies required-field gating, and delivers baseline/stress-informed scenario outputs.
- Surface concentration insight commentary and analyst-ready query snippets, and persist results in Supabase schema `app_exposurescenario`.

## Enhancements implemented
- Parses deterministic exposure CSV inputs and validates the required columns (`exposure_id`, `account_name`, `country`, `peril`, `segment`, `tiv_gbp`, `attachment_gbp`, `limit_gbp`).
- Delivers baseline and stressed loss outputs, concentration summaries, and query snippets to support follow-on analysis while keeping the UI aligned with the shared Day-app visual language.
- Persists `app_exposurescenario_analysis_runs` and writes audit stages to track gate, analysis, and persistence lifecycle events.

## Corrections and fixes
- Bootstrapped and exposed the `app_exposurescenario` schema through Supabase Data API so persistence status flows to the UI without missing schema errors.
- Stabilised the layout: ensured intake is full-width with split left/right panes, increased CSV/CTA heights, and re-used the shared light-blue theme from earlier apps.

## Data and audit
- Schema: `app_exposurescenario`
- Tables: `app_exposurescenario_analysis_runs`, `app_exposurescenario_audit`
- Audit stages: `request_received`, `validation_failed`, `analysis_completed`, `analysis_failed`

## Analytics
- Statcounter is active on the day-16 route so we capture usage and referral introductions for the exposure modeller.

## Lessons learnt
- Keep Vercel project linkage explicit per app to avoid cross-project deploys.
- Ensure monorepo project settings are pinned (`rootDirectory`, workspace install/build commands).
- Set shared Supabase env vars at project level before production deploy.
- Run visual smoke + runtime console checks before release.

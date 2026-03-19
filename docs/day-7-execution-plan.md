# Day 7 Execution Plan - Cat Event Briefing

Date: 2026-03-19  
Target build date: 2026-03-20  
App slug: `cat-event-briefing`  
Working title: Cat Event Briefing

## Objective
- Capture a catastrophe event bulletin and produce a deterministic event briefing.
- Surface affected classes, initial loss band, referral warnings, and first-day actions.
- Support reviewer query prompts against briefing text.

## Inputs and contract
- Input modes:
  - `.txt` upload
  - paste event bulletin text
  - built-in sample scenarios
- Minimum required field gate:
  - `eventText` minimum 120 characters
- Optional fields:
  - `sourceLabel`
  - `question`

## Core output
- Summary:
  - peril classification
  - severity score and label
  - event date (if detected)
  - detected region count
  - deterministic estimated loss band
- Briefing sections:
  - facts
  - impact observations
  - suggested actions
- Affected class of business table with priority and rationale.
- Warning triggers and query snippets.

## API and persistence plan
- Route: `POST /api/cateventbriefing/analyze`
- Response shape:
  - `requestId`
  - `analysis`
  - `persistence` (`stored`/`skipped`/`failed` + reason)
  - `processingTimeMs`
- Supabase schema:
  - `app_cateventbriefing`
  - `app_cateventbriefing_analysis_runs`
  - `app_cateventbriefing_audit`
- Mandatory non-blocking audit stages:
  - `request_received`
  - `validation_failed`
  - `analysis_completed`
  - `analysis_failed`

## UI/UX implementation plan
- Reuse Day 6 card rhythm, spacing, and intake symmetry.
- Left panel: source upload and scenario cards.
- Right panel: event bulletin and query prompt.
- New Day 7 logo in shared logo set and `icon.svg`.
- Warning rows use amber `!` treatment for visual urgency.

## Testing and QA plan
- Unit tests:
  - peril detection
  - severity and warning logic
  - deterministic class impact output
- Route tests:
  - valid payload
  - minimum-content gate failure
  - persistence + audit integration behavior
- Visual QA:
  - desktop home
  - desktop analyzed
  - desktop validation error
  - mobile home
  - mobile analyzed

## Definition of done (Day 7)
- Deterministic outputs and no flaky behavior on sample runs.
- Supabase analysis + audit records verified.
- Lint, test, typecheck, and build pass.
- Symmetry and label alignment confirmed visually.
- README and DB init script complete.

# Day 6 Execution Plan - Exposure Accumulation Heatmap

Date: 2026-03-18  
Target build date: 2026-03-19  
App slug: `exposure-accumulation-heatmap`  
Working title: Exposure Accumulation Heatmap

## Objective
- Upload insured location CSV data with TIV values.
- Validate required geospatial and exposure fields.
- Render an interactive accumulation heatmap.
- Surface concentration hotspots and reviewer commentary.

## Inputs and contract
- Input modes:
  - CSV upload (`.csv`)
  - Paste CSV text
  - built-in sample dataset (public/synthetic mixed scenarios)
- Minimum required fields:
  - `location_id`
  - `latitude`
  - `longitude`
  - `country`
  - `tiv`
- Optional enrichment fields:
  - `lob`
  - `peril`
  - `insured_name`
  - `city`
  - `postal_code`

## Core output
- Extracted/validated row count.
- Aggregated exposure totals:
  - total TIV
  - top concentration clusters
  - country and LOB concentration.
- Heatmap layers:
  - weighted point intensity by TIV
  - optional cluster circles for high-density points.
- Commentary:
  - accumulation warnings
  - peak-zone review actions
  - query-ready snippets.

## API and persistence plan
- Route: `POST /api/exposureheatmap/analyze`
- Response shape:
  - `requestId`
  - `analysis` (metrics + hotspots + warnings + commentary + query hits)
  - `persistence` (`stored`/`skipped`/`failed` + reason)
  - `processingTimeMs`
- Supabase schema:
  - `app_exposureheatmap`
  - `app_exposureheatmap_analysis_runs`
  - `app_exposureheatmap_audit`
- Mandatory non-blocking audit stages:
  - `request_received`
  - `validation_failed`
  - `analysis_completed`
  - `analysis_failed`

## UI/UX implementation plan
- Reuse Day 5 frame rhythm and intake symmetry.
- Left panel: source + upload controls + sample cards.
- Right panel: CSV preview + query prompt + analyze action.
- Ensure both top intake columns align at same baseline and height.
- Results layout:
  - heatmap canvas/card
  - concentration metrics card
  - warnings/commentary card
  - top clusters table.
- Add a new Day 6 logo in shared logo set (no icon reuse).

## Testing and QA plan
- Unit tests:
  - CSV parser normalization
  - geolocation/tiv required gate
  - hotspot aggregation logic
  - warning threshold logic.
- Route tests:
  - valid dataset
  - missing required fields
  - persistence `stored`/`skipped`/`failed`
  - audit writes on pass/fail paths.
- Visual QA (required):
  - desktop home
  - desktop analyzed (hotspot-heavy sample)
  - mobile home
  - mobile analyzed
  - validation error state.

## Dependencies and risks
- Map rendering library choice:
  - prefer lightweight `react-leaflet` + `leaflet.heat` or direct canvas layer.
- CSV quality variance:
  - add strict parser diagnostics with row-level error summaries.
- Coordinate validity:
  - reject or isolate non-numeric/out-of-range coordinates.

## Definition of done (Day 6)
- App builds and runs locally with deterministic sample output.
- Supabase analysis + audit records confirmed in production.
- Vercel deployment successful.
- README + init SQL + tests + screenshots complete.
- RAG docs and lessons updated with Day 6 learnings.

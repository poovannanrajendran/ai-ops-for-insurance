# Exposure Accumulation Heatmap (Day 6)

Day 6 app in the 30-Day Insurance AI Challenge.

## What it does

- Accepts exposure CSV input with location coordinates and TIV.
- Validates required columns and numeric constraints.
- Produces deterministic accumulation outputs:
  - hotspot ranking by country
  - concentration split
  - warning triggers
  - query hit snippets.

## Local run

```sh
pnpm --filter @ai-ops/exposure-accumulation-heatmap dev
```

App runs on `http://localhost:3006`.

## API

- `POST /api/exposureheatmap/analyze`

Request:

```json
{
  "csvText": "location_id,country,latitude,longitude,tiv\nLOC-1,United Kingdom,51.5,-0.12,12000000",
  "sourceLabel": "sample.csv",
  "question": "Which country concentration needs referral review?"
}
```

## Supabase bootstrap

Run:

- `db/init_exposureheatmap.sql`

This creates:

- `app_exposureheatmap.app_exposureheatmap_analysis_runs`
- `app_exposureheatmap.app_exposureheatmap_audit`

## Notes

- Audit writes are non-blocking and cover: `request_received`, `validation_failed`, `analysis_completed`, `analysis_failed`.
- Expose `app_exposureheatmap` in Supabase Data API before expecting `persistence.status = stored`.

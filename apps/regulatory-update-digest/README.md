# Regulatory Update Digest (Day 20)

Day 20 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts structured regulatory feed text (paste/upload/sample).
- Parses bulletin blocks deterministically (`SOURCE`, `TITLE`, `DATE`, `CLASS`, `UPDATE`, `ACTION`).
- Scores update relevance by selected class focus and urgency cues.
- Produces executive brief, priority alerts, and governance action board.
- Persists analysis plus non-blocking audit stages to Supabase when configured.

## Local run
```bash
pnpm --filter @ai-ops/regulatory-update-digest dev
```

App runs on `http://localhost:3020`.

## Validation
```bash
pnpm --filter @ai-ops/regulatory-update-digest lint
pnpm --filter @ai-ops/regulatory-update-digest typecheck
pnpm --filter @ai-ops/regulatory-update-digest test
pnpm --filter @ai-ops/regulatory-update-digest build
```

## API
- `POST /api/regulatorydigest/analyze`
- Request:
  - `feedText` (required, min 120 chars)
  - `classFocus` (required)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes:
  - `requestId`
  - `analysis`
  - `persistence.status`
  - `processingTimeMs`

## Database bootstrap
Run:
- `db/init_regulatorydigest.sql`

Creates:
- `app_regulatorydigest.app_regulatorydigest_analysis_runs`
- `app_regulatorydigest.app_regulatorydigest_audit`

Audit stages (non-blocking):
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

## Samples
- `samples/balanced-regulatory-feed.txt`
- `samples/urgent-sanctions-feed.txt`
- `samples/missing-required-feed.txt`
- provenance notes: `samples/SOURCES.md`

## Notes
- Expose `app_regulatorydigest` in Supabase Data API before expecting `persistence.status = stored`.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

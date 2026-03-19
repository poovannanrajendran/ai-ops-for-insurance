# Cat Event Briefing (Day 7)

Day 7 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts catastrophe event bulletin text (`.txt` upload or pasted content).
- Runs deterministic peril, severity, region, and affected-class analysis.
- Produces briefing facts, impacts, suggested actions, warning triggers, and query snippets.
- Persists analysis and audit trail in Supabase when credentials/schema are enabled.

## Local run
```bash
pnpm --filter @ai-ops/cat-event-briefing dev
```

App runs on `http://localhost:3007`.

## API
- `POST /api/cateventbriefing/analyze`
- Request:
  - `eventText` (required, min 120 chars)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes:
  - `requestId`
  - `analysis`
  - `persistence.status`
  - `processingTimeMs`

## Database bootstrap
Run:
- `db/init_cateventbriefing.sql`

Creates:
- `app_cateventbriefing.app_cateventbriefing_analysis_runs`
- `app_cateventbriefing.app_cateventbriefing_audit`

Audit stages (non-blocking):
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

## Notes
- Expose `app_cateventbriefing` in Supabase Data API before expecting `persistence.status = stored`.
- Configure env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

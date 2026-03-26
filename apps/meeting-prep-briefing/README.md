# Meeting Prep Briefing (Day 21)

Day 21 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts structured meeting notes as pasted text or `.txt` uploads.
- Parses deterministic key-value briefing fields (client, objective, risks, open items, stakeholders).
- Produces an executive meeting pack: context overview, stakeholder map, risk cues, and talking points.
- Persists analysis + non-blocking audit stages to Supabase when available.

## Local run
```bash
pnpm --filter @ai-ops/meeting-prep-briefing dev
```

App runs on `http://localhost:3021`.

## Validation
```bash
pnpm --filter @ai-ops/meeting-prep-briefing lint
pnpm --filter @ai-ops/meeting-prep-briefing typecheck
pnpm --filter @ai-ops/meeting-prep-briefing test
pnpm --filter @ai-ops/meeting-prep-briefing build
```

## API
- `POST /api/meetingprep/analyze`
- Request:
  - `briefingText` (required, min 120 chars)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes:
  - `requestId`
  - `analysis`
  - `persistence.status`
  - `processingTimeMs`

## Database bootstrap
Run:
- `db/init_meetingprep.sql`

Creates:
- `app_meetingprep.app_meetingprep_analysis_runs`
- `app_meetingprep.app_meetingprep_audit`

Audit stages (non-blocking):
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

## Samples
- `samples/balanced-renewal-briefing.txt`
- `samples/high-risk-referral-briefing.txt`
- `samples/missing-required-briefing.txt`
- provenance notes: `samples/SOURCES.md`

## Notes
- Expose `app_meetingprep` in Supabase Data API before expecting `persistence.status = stored`.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

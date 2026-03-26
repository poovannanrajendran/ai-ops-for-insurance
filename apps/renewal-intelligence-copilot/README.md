# Renewal Intelligence Copilot (Day 22)

Day 22 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts structured renewal pack text via paste/upload/sample.
- Parses deterministic renewal fields and computes pricing signal drivers.
- Produces strategy memo, negotiation talking points, and action plan.
- Persists analysis plus non-blocking audit stages in Supabase when configured.

## Local run
```bash
pnpm --filter @ai-ops/renewal-intelligence-copilot dev
```

App runs on `http://localhost:3022`.

## Validation
```bash
pnpm --filter @ai-ops/renewal-intelligence-copilot lint
pnpm --filter @ai-ops/renewal-intelligence-copilot typecheck
pnpm --filter @ai-ops/renewal-intelligence-copilot test
pnpm --filter @ai-ops/renewal-intelligence-copilot build
```

## API
- `POST /api/renewalcopilot/analyze`
- Request:
  - `renewalText` (required, min 120 chars)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes `requestId`, `analysis`, `persistence.status`, and `processingTimeMs`.

## Database bootstrap
Run:
- `db/init_renewalcopilot.sql`

Creates:
- `app_renewalcopilot.app_renewalcopilot_analysis_runs`
- `app_renewalcopilot.app_renewalcopilot_audit`

Audit stages:
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

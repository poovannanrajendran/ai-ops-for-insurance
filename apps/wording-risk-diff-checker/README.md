# Wording Risk Diff Checker (Day 19)

Day 19 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts baseline and revised wording as pasted text or `.txt` uploads.
- Parses clause-style wording deterministically and compares risk-impact deltas.
- Tags added, removed, and changed clauses with severity and risk categories.
- Persists analysis and non-blocking audit stages in Supabase when credentials and schema access are available.

## Local run
```bash
pnpm --filter @ai-ops/wording-risk-diff-checker dev
```

App runs on `http://localhost:3019`.

## Validation
```bash
pnpm --filter @ai-ops/wording-risk-diff-checker lint
pnpm --filter @ai-ops/wording-risk-diff-checker typecheck
pnpm --filter @ai-ops/wording-risk-diff-checker test
pnpm --filter @ai-ops/wording-risk-diff-checker build
```

## API
- `POST /api/wordingriskdiff/analyze`
- Request:
  - `baselineText` (required, min 120 chars)
  - `revisedText` (required, min 120 chars)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes:
  - `requestId`
  - `analysis`
  - `persistence.status`
  - `processingTimeMs`

## Database bootstrap
Run:
- `db/init_wordingriskdiff.sql`

Creates:
- `app_wordingriskdiff.app_wordingriskdiff_analysis_runs`
- `app_wordingriskdiff.app_wordingriskdiff_audit`

Audit stages (non-blocking):
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

## Samples
- `samples/synthetic-property-coverage-restriction-baseline.txt`
- `samples/synthetic-property-coverage-restriction-revised.txt`
- `samples/synthetic-liability-expansion-baseline.txt`
- `samples/synthetic-liability-expansion-revised.txt`
- `samples/short-note.txt`
- provenance notes: `samples/SOURCES.md`

## Notes
- Expose `app_wordingriskdiff` in Supabase Data API before expecting `persistence.status = stored`.
- Configure env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

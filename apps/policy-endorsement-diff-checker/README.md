# Policy Endorsement Diff Checker (Day 8)

Day 8 app in the 30-Day Insurance AI Challenge.

## What it does
- Accepts expiring and renewal endorsement wording as pasted text or `.txt` upload.
- Parses clause-style wording deterministically and compares expiring vs renewal content.
- Surfaces material changes with severity labels, warnings, query hits, and an executive brief.
- Persists analysis and audit trail in Supabase when credentials/schema are enabled.

## Local run
```bash
pnpm --filter @ai-ops/policy-endorsement-diff-checker dev
```

App runs on `http://localhost:3008`.

## Validation
```bash
pnpm --filter @ai-ops/policy-endorsement-diff-checker lint
pnpm --filter @ai-ops/policy-endorsement-diff-checker typecheck
pnpm --filter @ai-ops/policy-endorsement-diff-checker test
pnpm --filter @ai-ops/policy-endorsement-diff-checker build
```

## API
- `POST /api/policyendorsementdiff/analyze`
- Request:
  - `expiringText` (required, min 80 chars)
  - `renewalText` (required, min 80 chars)
  - `sourceLabel` (optional)
  - `question` (optional)
- Response includes:
  - `requestId`
  - `analysis`
  - `persistence.status`
  - `processingTimeMs`

## Database bootstrap
Run:
- `db/init_policyendorsementdiff.sql`

Creates:
- `app_policyendorsementdiff.app_policyendorsementdiff_analysis_runs`
- `app_policyendorsementdiff.app_policyendorsementdiff_audit`

Audit stages (non-blocking):
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

## Notes
- Expose `app_policyendorsementdiff` in Supabase Data API before expecting `persistence.status = stored`.
- Configure env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

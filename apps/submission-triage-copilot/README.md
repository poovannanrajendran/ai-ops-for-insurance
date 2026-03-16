# Submission Triage Copilot

Day 1 app for the 30-day challenge.

## Purpose

Accept broker submission content, extract key underwriting signals, score it against an MVP appetite baseline, and return an `accept`, `refer`, or `decline` recommendation with rationale.

## Current scope

- text-first and spreadsheet-assisted intake
- rule-based extraction and appetite scoring
- API route for internal submission triage
- Excel, CSV, and text upload support in the UI
- Supabase persistence when either a service-role or publishable server key is available

## Architecture

- `src/app/page.tsx`
  - single-screen underwriting intake and decision view
- `src/app/api/submissiontriage/analyze/route.ts`
  - request validation, structured logging, analysis orchestration, and optional persistence
- `src/services/analyze-submission.ts`
  - text extraction heuristics and MVP appetite scoring rules
- `db/init_submissiontriage.sql`
  - idempotent schema bootstrap for the app tables

## API

`POST /api/submissiontriage/analyze`

Request body:

```json
{
  "submissionText": "Broker: ... Territory: ... Class: ... Limit: ..."
}
```

Response shape:

```json
{
  "requestId": "uuid",
  "analysis": {
    "extracted": {
      "broker": "Example Wholesale",
      "classOfBusiness": "Property",
      "territory": "United Kingdom",
      "currency": "GBP",
      "limitAmount": 5000000,
      "warningFlags": []
    },
    "decision": "accept",
    "confidence": 0.9,
    "rationale": ["..."]
  },
  "persistence": {
    "status": "stored"
  },
  "processingTimeMs": 742
}
```

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/submission-triage-copilot dev
```

The app runs on `http://localhost:3001`.

## Verification

```sh
pnpm --filter @ai-ops/submission-triage-copilot test
pnpm --filter @ai-ops/submission-triage-copilot build
```

## Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If the service-role key is not present, the route falls back to the publishable key for local-only server access. If the underlying schema or permissions are still missing, the UI surfaces the actual storage failure instead of silently skipping.

## Sample file

- `samples/submission-triage-sample.xlsx`

## Deploy checklist

- confirm `.env.local` values are mirrored into the Vercel project
- run `db/init_submissiontriage.sql` in Supabase
- verify the `/api/submissiontriage/analyze` route returns a stored result
- test the text-first demo flow end to end on the deployed URL

# Day 3 Handoff: Risk Appetite Parser

Date: 2026-03-16  
Branch: `main`  
Repo: `/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance`

Continuation update: 2026-03-17

## Objective

Build Day 3 app (`risk-appetite-parser`) using Day 1/Day 2 lessons:
- professional symmetric UI/UX
- deterministic extraction flow
- required-field gate
- Supabase persistence with explicit schema and grants guidance
- deploy/readme/guardrail updates

## Completed

1. New app scaffolded at `apps/risk-appetite-parser` from Day 2 baseline.
2. Implemented deterministic extraction service:
   - file: `apps/risk-appetite-parser/src/services/analyze-risk-appetite.ts`
   - extracts standard fields:
     - `insured_name`
     - `class_of_business`
     - `territory`
     - `max_line_size`
     - `currency`
     - `minimum_premium`
     - `inception_date`
     - `expiry_date`
     - `excluded_risks`
     - `subjectivities`
     - `referral_triggers`
   - includes required gate:
     - `class_of_business`
     - `territory`
     - `max_line_size`
   - adds warnings/commentary/query-hit generation.
3. Implemented Day 3 API route:
   - file: `apps/risk-appetite-parser/src/app/api/riskappetite/analyze/route.ts`
   - request: `statementText`, optional `sourceLabel`, optional `question`
   - optional Supabase persistence
   - improved Data API/schema/permission bootstrap error hints.
4. Implemented Day 3 UI:
   - file: `apps/risk-appetite-parser/src/app/page.tsx`
   - symmetric intake layout
   - text + file upload (`.txt`, `.pdf`)
   - full-width whitespace field mapping table
   - commentary, warnings, query hits, storage status cards
   - analysis timer format `MM:SS:CS`
   - branding line includes:
     - app project and app name
     - `Created by Poovannan Rajendran`.
5. Added PDF extraction support in-browser via `pdfjs-dist`.
6. Added Day 3 logos/icons:
   - shared logo: `packages/common-ui/src/logos.tsx` (`RiskAppetiteLogo`)
   - app icon: `apps/risk-appetite-parser/src/app/icon.svg`.
7. Added Day 3 samples:
   - `apps/risk-appetite-parser/samples/balanced-appetite.txt`
   - `apps/risk-appetite-parser/samples/referral-heavy-appetite.txt`
   - `apps/risk-appetite-parser/samples/missing-required-fields.txt`
   - plus inline UI samples in `src/lib/demo-samples.ts`.
8. Added Supabase init script:
   - `apps/risk-appetite-parser/db/init_riskappetite.sql`
   - includes schema/table/index and grants/default privileges.
9. Updated root/shared config:
   - `packages/config/src/apps.ts` adds `riskAppetiteApp`
   - `package.json` adds `deploy:day3`
   - `README.md` updated app list + run/deploy notes
   - `docs/lessons-learned.md` updated with Day 3 guardrails.
10. Linear updates posted on `POO-8` during implementation.
11. Continuation patch applied to extraction parser:
    - file: `apps/risk-appetite-parser/src/services/analyze-risk-appetite.ts`
    - fixed list splitting so numeric amounts like `15,000,000` are not broken into separate tokens.
    - preserved all-caps acronyms/tokens (for example `GBP`, `TIV`) during title-casing.
12. Added regression assertion:
    - file: `apps/risk-appetite-parser/tests/analyze-risk-appetite.test.ts`
    - verifies referral trigger extraction keeps `GBP 15,000,000 TIV` intact.
13. Updated malformed sample payloads so UI "Missing required data" demo triggers required-field warnings instead of text-length validation:
    - `apps/risk-appetite-parser/src/lib/demo-samples.ts`
    - `apps/risk-appetite-parser/samples/missing-required-fields.txt`
14. Completed Vercel production deployment and alias:
    - `https://risk-appetite-parser.vercel.app`
    - project: `poovannanrajendrans-projects/risk-appetite-parser`
15. Configured Day 3 Vercel production environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`

## Verification Status

Executed successfully:
- `pnpm install`
- `pnpm --filter @ai-ops/risk-appetite-parser test` (pass)
- `pnpm --filter @ai-ops/risk-appetite-parser typecheck` (pass)
- `pnpm --filter @ai-ops/risk-appetite-parser build` (pass)
- `pnpm --filter @ai-ops/risk-appetite-parser dev` (starts successfully on `http://localhost:3001` when run outside sandbox)
- API smoke validation for complete and missing-field payloads (pass; required gate confirmed)
- Supabase persistence validation (2026-03-17): `persistence.status=stored` for complete and missing-field payloads.
- Production API validation (2026-03-17): `persistence.status=stored` on `https://risk-appetite-parser.vercel.app/api/riskappetite/analyze`.
- Visual verification completed:
  - desktop and mobile local screenshots captured
  - production UI walkthrough completed including:
    - successful balanced run
    - successful required-field warning run via malformed sample

## Open / Follow-up

1. Day 3 implementation, validation, and deployment are complete.

## Next Operator Steps

1. Optional hardening follow-up:
   - update `scripts/deploy-vercel-app.sh` to support monorepo root-directory deployments cleanly, since default `--cwd apps/<app>` behavior conflicts with project `rootDirectory` settings.

## Files Changed (High Signal)

- `apps/risk-appetite-parser/**` (new Day 3 app)
- `packages/common-ui/src/logos.tsx`
- `packages/config/src/apps.ts`
- `package.json`
- `README.md`
- `docs/lessons-learned.md`

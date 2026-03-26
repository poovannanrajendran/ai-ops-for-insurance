# Post-Day-14 Improvements (Quality, Consistency, Automation)

Date: 2026-03-25  
Scope: Improvements introduced after Day 14 implementation completion.

## 1. UI consistency hardening (Day 12-14)

- Restored and standardised shared bordered card styling through shared UI:
  - `packages/common-ui/src/card.tsx`
- Aligned Day 12-14 theme tokens to match earlier app visual language:
  - `apps/treaty-structure-explainer/src/app/globals.css`
  - `apps/exposure-clash-detector/src/app/globals.css`
  - `apps/claims-leakage-flagger/src/app/globals.css`
- Added consistent small status indicators:
  - green = no issues
  - amber = warning
  - red = issue/error
- Applied status indicators in Day 12-14 page components:
  - `apps/treaty-structure-explainer/src/app/page.tsx`
  - `apps/exposure-clash-detector/src/app/page.tsx`
  - `apps/claims-leakage-flagger/src/app/page.tsx`

## 2. Automated visual QA improvements

- Added Playwright config and reusable visual smoke test:
  - `playwright.config.ts`
  - `tests/playwright/app-visual-smoke.spec.ts`
- Added Day 12-14 visual regression/smoke coverage:
  - `tests/playwright/day12-14-visual.spec.ts`
- Added wrappers that auto-start app dev servers, run visual checks, and exit cleanly:
  - `scripts/qa/run-day12-14-visual.sh`
  - `scripts/qa/run-app-visual.sh`

## 3. Test quality enforcement (positive + negative)

- Added reusable test-contract validator:
  - `scripts/qa/verify-app-tests.mjs`
- Enforces that app tests include:
  - positive and negative analyzer/service tests
  - explicit route assertions for `200` and `400` paths
- Added shared UI unit guard for bordered card contract:
  - `packages/common-ui/tests/card.test.tsx`

## 4. One-command per-app quality gate

- Added consolidated quality runner:
  - `scripts/qa/run-app-quality-gates.sh`
- Covers required sequence:
  - predeploy checks
  - test-contract verification
  - lint
  - unit/integration tests
  - typecheck
  - build
  - visual smoke test
- Package scripts added:
  - `pnpm qa:app <app-folder> @ai-ops/<app-folder> <port>`
  - `pnpm test:visual:app <app-folder> @ai-ops/<app-folder> <port>`
  - `pnpm test:visual:day12-14`
  - `pnpm test:ui:common`

## 5. Supabase bootstrap and Data API automation

- Added app schema bootstrap script:
  - `scripts/supabase/bootstrap-schema.sh <app-slug>`
- Added all-app bootstrap script:
  - `scripts/supabase/bootstrap-all-schemas.sh`
- Script behavior:
  - applies app `init_*.sql`
  - ensures `pgrst.db_schemas` includes target app schema
  - triggers PostgREST config reload
  - verifies schema availability through REST `Accept-Profile`
- Added package scripts:
  - `pnpm supabase:bootstrap:schema <app-slug>`
  - `pnpm supabase:bootstrap:all`
- Added runbook:
  - `docs/supabase-bootstrap-and-data-api.md`

## 6. Scaffold upgrade for future apps

- Upgraded `scripts/new-day-app.sh` to generate stronger defaults:
  - standard design/theme baseline
  - analyzer/service template
  - positive + negative unit tests
  - positive + negative route tests
  - QA command guidance in generated README/next steps

## 7. Documentation and knowledge-sync updates

- Updated checklists to enforce new standards:
  - `docs/day-app-dod-checklist.md`
  - `docs/app-build-quality-checklist.md`
- Updated RAG brief with hardening notes:
  - `docs/rag/cross-agent-rag-brief.md`
- Synced RAG after updates:
  - `pnpm rag:sync-all`
- External tracking updates completed:
  - Linear project documents
  - Notion project overview comments

## 8. Net impact

- Reduced visual drift risk across day apps.
- Added executable quality gates instead of manual-only checks.
- Enforced positive/negative testing as a default standard.
- Reduced Supabase onboarding/configuration error rate via automation.
- Improved repeatability for Day 15 onward delivery.

## 9. Codex-specific token-efficiency workflow

- Added a Codex-focused tiered context model to reduce unnecessary context loading:
  - Tier 1 (always read): `docs/codex/context-core.md`
  - Tier 2 (load on demand): `docs/codex/context-index.md`
  - Tier 3 (reference only): full historical docs unless needed
- Added Codex resume and brief scripts:
  - `scripts/codex/context-brief.sh`
  - `scripts/codex/resume.sh`
- Added package shortcuts:
  - `pnpm codex:brief`
  - `pnpm codex:resume`
- Added handoff standardisation template:
  - `docs/codex/handoff-template.md`
- Updated repo guidance:
  - `.codex/README.md`
  - `README.md` (Codex Context Efficiency section)

## 10. Vercel monorepo deployment lessons (Day 12-19)

- CLI deployment reliability improved by enforcing per-project monorepo settings:
  - `rootDirectory = apps/<app-folder>`
  - `installCommand = pnpm install --frozen-lockfile --dir ../..`
  - `buildCommand = pnpm --dir ../.. --filter @ai-ops/<app-package> build`
- Root cause addressed:
  - incorrect local `.vercel` links and missing `rootDirectory` caused cross-project deployments and wrong app builds.
- New operational rule:
  - relink explicitly to the intended project before each deployment and verify project linkage before build/deploy.
- Environment variable standardisation:
  - `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are now enforced in each day-app project before production deploy.
- Validation outcome:
  - Day 12-19 projects now deployed as separate Vercel projects with correct project-level aliases.

# App Build Quality Checklist (All Days)

Date: 2026-03-18
Applies to: Day 5 onward and retrofits to existing apps when touched

## Checkpoint at Day 10

- Milestone achieved: Day 10 shipped with deterministic analysis, stable UI symmetry, and verified persistence/audit behavior.
- What changed at this checkpoint:
- We standardized warning visuals and reduced UI ambiguity in intake/result layouts.
- We adopted CLI-first deploy workflows to avoid Vercel Hobby Git-connected project cap risk.
- We formalized predeploy validation and app scaffolding automation.
- New operational assets introduced:
- `scripts/predeploy-check.sh` for env/schema/table/root-directory preflight checks.
- `scripts/new-day-app.sh` for day-app scaffolding (app shell, DB init, docs starter).
- `docs/day-app-dod-checklist.md` as the release-grade Definition of Done.
- Minimum release command order from this point:
- `bash scripts/predeploy-check.sh <app-folder>`
- `pnpm --filter @ai-ops/<app-folder> lint && test && typecheck && build`
- `vercel link --cwd <repo-root> --project <project-name> --yes`
- `vercel --cwd <repo-root> --prod --yes`

## 1. Architecture and contracts

- Define app metadata first (`slug`, `shortName`, `schema`, `devPort`) in shared config.
- Define request/response contract before coding UI.
- Keep route output deterministic where possible; avoid opaque output-only responses.
- Include `requestId`, `processingTimeMs`, and `persistence.status` in API responses.

## 2. Database and audit standard (mandatory)

- Create app schema `app_<shortname>`.
- Create `app_<shortname>_analysis_runs`.
- Create `app_<shortname>_audit`.
- Add index on `created_at desc` for both tables.
- Add schema usage/table privileges/default privileges for `service_role`, `authenticated`, `anon`.
- In API route, write non-blocking audit entries:
  - `request_received`
  - `analysis_completed`
  - `validation_failed` and/or `analysis_failed`

## 3. API reliability checklist

- Validate request body with Zod and explicit error messages.
- Add minimum required-field or minimum-length gate.
- Keep persistence optional and safe:
  - `stored` when successful
  - `skipped` when env/schema not available
  - `failed` with actionable reason when insert fails
- Use structured logger with app key and request ID.

## 4. UI/UX symmetry and layout checklist

- Intake layout must use side-by-side symmetric columns on desktop.
- Left and right top labels must align exactly (same spacing pattern).
- Main intake panels should match visual height and top baseline.
- Avoid double-box confusion:
  - no nested bordered containers that look like duplicated input fields.
- Keep consistent border weight, radius, and spacing rhythm across panels.
- Mobile must preserve hierarchy (source/input before output).

## 5. Theme and color standards

- Keep one intentional palette per app (define CSS variables).
- Reuse core challenge visual language:
  - neutral surface + teal accent family unless explicit variation is desired.
- Ensure readable contrast for headings/body/status text.
- Avoid ad-hoc color drift across cards, badges, and controls.

## 6. Logo and visual identity checklist

- Add a new app logo component in `packages/common-ui/src/logos.tsx`.
- Use a unique icon metaphor per app (not reused from prior day).
- Keep logo geometry aligned with existing logo set:
  - square viewBox
  - rounded container
  - clear foreground motif
- Add `src/app/icon.svg` for each app.

## 7. Sample data and provenance checklist

- Provide at least 3 sample scenarios:
  - baseline/happy path
  - warning/referral/ambiguous path
  - missing-required-data gate path
- For public-domain content, include `samples/SOURCES.md` with URL + access date.

## 8. Test and quality gates (required)

- Unit tests for core analyzer/service.
- Unit tests must include both positive and negative cases.
- Route tests for:
  - valid request
  - validation/gate failure
  - persistence stored/skipped/failed paths
- Route tests must assert `200` and `400` explicitly.
- Run test contract verifier:
  - `node scripts/qa/verify-app-tests.mjs <app-folder>`
- Run Playwright visual smoke:
  - `bash scripts/qa/run-app-visual.sh <app-folder> @ai-ops/<app-folder> <port>`
- Run and pass:
  - `lint`
  - `test`
  - `typecheck`
  - `build`

## 9. Deployment checklist (Vercel)

- Separate Vercel project per app.
- Root directory must be `apps/<app-folder>`.
- Output directory should be empty for Next.js.
- Required production env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Post-deploy API smoke test must return `200` and expected `persistence.status`.

## 10. Visual QA checklist

- Capture desktop home screenshot.
- Capture mobile home screenshot.
- Capture analyzed/result state screenshot.
- Validate:
  - intake symmetry
  - label alignment
  - no clipping/overflow on key cards
  - action button placement consistency

## 11. Documentation and memory sync

- Update app README.
- Add execution plan and handoff doc.
- Append relevant entries to:
  - `docs/lessons-learned.md`
  - `docs/rag/critical-memory.md`
  - `docs/rag/guardrails.md` (if new cross-app rule introduced)
- Run RAG sync after major doc updates.

## 12. Copy/Paste release checklist (per day app)

- [ ] App topic and acceptance criteria copied from roadmap into `docs/day-<n>-execution-plan.md`.
- [ ] New app logo created and wired (shared logo + app icon).
- [ ] Intake panel is symmetric (source and text/preview panels aligned).
- [ ] Theme tokens reviewed (surface, accent, borders, warning/success states).
- [ ] Required-field gate and user-facing validation messages implemented.
- [ ] API response contains `requestId`, `processingTimeMs`, and `persistence.status`.
- [ ] Analysis table writes verified in Supabase.
- [ ] Audit table writes verified for success and failure paths.
- [ ] Unit tests pass.
- [ ] Unit tests include positive + negative scenarios.
- [ ] API route tests pass.
- [ ] API route tests include explicit `200` + `400` assertions.
- [ ] `lint`, `test`, `typecheck`, `build` all pass locally.
- [ ] `node scripts/qa/verify-app-tests.mjs <app-folder>` passes.
- [ ] `bash scripts/qa/run-app-visual.sh <app-folder> @ai-ops/<app-folder> <port>` passes.
- [ ] Visual screenshots captured for desktop/mobile and analyzed/error states.
- [ ] Vercel settings verified (root directory, build/install commands, env vars).
- [ ] Production smoke test returns expected class/result and `persistence.status=stored`.
- [ ] RAG sync completed.
- [ ] Linear and Notion updated with completion + next-day plan.

# Day App Definition of Done (DoD)

Date: 2026-03-20  
Applies to: Every day app from Day 11 onward (and retrofits when existing apps are touched)

## 1. Build and correctness gates

- [ ] `pnpm --filter <pkg> lint` passes
- [ ] `pnpm --filter <pkg> test` passes
- [ ] `pnpm --filter <pkg> typecheck` passes
- [ ] `pnpm --filter <pkg> build` passes
- [ ] Route-level request validation is implemented with explicit error messages
- [ ] Required-field or minimum-input gate exists and is tested

## 2. Database and audit gates

- [ ] App schema exists: `app_<shortname>`
- [ ] Analysis table exists: `app_<shortname>_analysis_runs`
- [ ] Audit table exists: `app_<shortname>_audit`
- [ ] API writes non-blocking audit stages:
- `request_received`
- `analysis_completed`
- `validation_failed` and/or `analysis_failed`
- [ ] `persistence.status` semantics are enforced:
- `stored`, `skipped`, `failed`

## 3. UI/UX and visual gates

- [ ] Intake is symmetric (left/right top labels aligned)
- [ ] Primary source and text/content panes are visually balanced
- [ ] No duplicate-looking nested input boxes
- [ ] Warning visuals are obvious and consistent (amber warning state)
- [ ] Desktop and mobile screenshots captured
- [ ] Result state screenshot captured

## 4. Deployment and runtime gates

- [ ] Vercel project root directory is `apps/<app-folder>`
- [ ] Required env vars present for runtime:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase Data API exposes app schema
- [ ] Production smoke run succeeds (HTTP `200`)
- [ ] Production run confirms DB write + audit write

## 5. Required command sequence (release path)

```bash
# 1) Sanity and config checks
bash scripts/predeploy-check.sh <app-folder>

# 2) Build/test quality gates
pnpm --filter @ai-ops/<app-folder> lint
pnpm --filter @ai-ops/<app-folder> test
pnpm --filter @ai-ops/<app-folder> typecheck
pnpm --filter @ai-ops/<app-folder> build

# 3) Deploy (CLI mode; works with Hobby 10-project Git connection cap)
vercel link --cwd <repo-root> --project <vercel-project-name> --yes
vercel --cwd <repo-root> --prod --yes
```

## 6. Optional accelerator commands

```bash
# Create a new day app scaffold
bash scripts/new-day-app.sh <day-number> <app-folder> <short-name> "<display-name>" <port>

# Example
bash scripts/new-day-app.sh 12 treaty-renewal-tracker treatyrenewal "Treaty Renewal Tracker" 3012
```

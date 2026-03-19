# Lessons Learned

## 2026-03-15 - Supabase schema exposure and permissions
- Creating a new schema is not enough. You must explicitly expose the schema under Supabase **API → Data API** or REST calls return `Invalid schema`.
- After exposing, grant usage and table privileges to the runtime roles (`service_role`, `anon`, `authenticated`) or REST calls return `permission denied for schema`.

## 2026-03-16 - Vercel monorepo output directory trap
- For Next.js apps in this monorepo, each app should be a separate Vercel project with `Root Directory` set to `apps/<app-folder>`.
- Do not set `Output Directory` to `public` for Next.js projects. Leave it empty and let Vercel handle `.next`.
- If `public` is set as output directory, deployments fail even when the build itself succeeds.

## 2026-03-16 - PNPM build script approval warning in Vercel
- Vercel may warn: `Ignored build scripts: sharp@...`.
- For this monorepo, allowlist `sharp` in `pnpm-workspace.yaml` using `onlyBuiltDependencies`.
- After updating the allowlist, run a fresh redeploy so the updated install behavior is picked up.

## 2026-03-16 - Shared RAG bootstrap gotchas
- For Docker-to-host Postgres connections, `host.docker.internal` works from containers, but host-shell `psql` should use `localhost`.
- When creating a dedicated RAG app user, grant schema usage plus table and sequence privileges (including default privileges) or ingestion fails with `permission denied for table`.
- Keep project registration in `docs/rag/projects.json` and run `rag:sync-all` to avoid stale memory across repositories.

## 2026-03-16 - Day 3 risk appetite parser guardrails
- Keep minimum required extraction gates explicit (`class_of_business`, `territory`, `max_line_size`) so incomplete statements fail fast in review.
- For new Supabase schemas, apply broad runtime grants and default privileges at bootstrap time to avoid repeat `permission denied` churn.
- If using PDF upload in-browser, include an extraction fallback message when no text layer is available.

## 2026-03-17 - Day 3 deployment and symmetry follow-ups
- In Vercel monorepos, the project `Root Directory` and CLI working directory must agree; mismatches can produce path duplication failures like `apps/<app>/apps/<app>/...`.
- For Next.js workspace apps, ensure Vercel can see `pnpm-lock.yaml` and workspace manifests during install, otherwise build can fail with lockfile or framework detection errors.
- Keep intake columns semantically symmetric: explicit top labels on both columns avoids perceived vertical misalignment and reduces UX confusion.

## 2026-03-17 - Day 4 slip reviewer implementation guardrails
- Keep Day 4 required gate explicit on extracted fields (`insured_name`, `inception_date`, `expiry_date`, `limit`, `currency`) so incomplete slips fail fast for reviewer workflow.
- Preserve intake symmetry with explicit top labels on both source and text columns; this avoids the double-box confusion seen in earlier Day 3 iterations.
- When adding public sample documents, include a source-attribution file (`samples/SOURCES.md`) with URL and access date to avoid provenance ambiguity.
- Standardized Day 2+ audit approach: each app should include an `<app>_audit` table and non-blocking audit writes in API routes to avoid silent loss of request lifecycle visibility.

## 2026-03-18 - Local runtime guardrail for shared workstation services
- On this machine, port `3000` is dedicated to OpenWebUI and should never be stopped or reused for app dev servers.
- Run challenge apps on alternate fixed ports per app (for example Day 4 on `3001`, Day 5 on `3005`) to avoid disrupting shared local services.

## 2026-03-18 - Day 5 Vercel deployment root-directory behavior
- In monorepo projects, Vercel `Root Directory` must reflect the path inside the repo for Git-based builds (`apps/class-of-business-classifier`).
- CLI deploy context and project root settings can conflict if deploying from a nested cwd; deploying from repository root avoids duplicate path resolution issues.
- Day 5 deploy succeeded with:
  - root directory: `apps/class-of-business-classifier`
  - install command: `pnpm install --frozen-lockfile --dir ../..`
  - build command: `pnpm --dir ../.. --filter @ai-ops/class-of-business-classifier build`

## 2026-03-19 - Day 6 heatmap and deployment guardrails
- A stylized SVG can look like an abstract diagram; Day 6 map quality improved only after switching to real world geometry (`world-atlas` + `d3-geo` + `topojson-client`).
- Exposure maps should support subtle auto-zoom around reported locations, but must cap zoom to preserve global context (`<= 1.35x` used in Day 6).
- Vercel project-level `Root Directory` must remain the monorepo path (`apps/exposure-accumulation-heatmap`) for Git builds; mismatched root settings produce `No Next.js version detected` even when the app package includes Next.js.

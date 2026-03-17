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

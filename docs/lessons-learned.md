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

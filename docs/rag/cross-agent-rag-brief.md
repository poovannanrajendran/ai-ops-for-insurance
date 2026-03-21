# Cross-Agent RAG Brief (Codex / Claude / Claude Code / Perplexity)

Last updated: 2026-03-21
Project: `ai-ops-for-insurance`

## Purpose
This file is the canonical context brief for new AI sessions. Ingest this into RAG and use it as the first reference when continuing implementation, debugging, deployment, or documentation.

## Project snapshot
- Challenge: 30 insurance AI apps in 30 days.
- Stack: Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3, Tailwind 4.2.1, Supabase, Vercel, PNPM workspaces.
- Repository layout:
  - `apps/` one app per day
  - `packages/` shared `config`, `common-ui`, `lib`
  - `docs/` plans, handoffs, lessons, rag guardrails.

## Critical environment rules
- Port `3000` is reserved for OpenWebUI on this machine. Do not stop or reuse it.
- Use app-specific alternate ports (examples: Day 4 `3001`, Day 5 `3005`, Day 6 `3006`).
- For Vercel monorepo apps, each app must be a separate Vercel project.

## Quality standard (must follow)
Primary checklist:
- `docs/app-build-quality-checklist.md`

Required per app:
- symmetric intake UI (left/right top labels aligned)
- deterministic API response with `requestId`, `processingTimeMs`, `persistence.status`
- Supabase analysis table + audit table
- non-blocking audit stages:
  - `request_received`
  - `validation_failed`
  - `analysis_completed`
  - `analysis_failed`
- pass `lint`, `test`, `typecheck`, `build`
- desktop/mobile visual QA screenshots.

## Deployment standards (Vercel)
For each app:
- Root Directory: `apps/<app-folder>`
- Framework: `Next.js`
- Output Directory: empty
- Install command (workspace): `pnpm install --frozen-lockfile --dir ../..`
- Build command (workspace filter): `pnpm --dir ../.. --filter @ai-ops/<app-name> build`
- Production env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_STATCOUNTER_PROJECT` (optional override; defaults set in shared component)
  - `NEXT_PUBLIC_STATCOUNTER_SECURITY` (optional override; defaults set in shared component)

## Supabase standards
For each app schema `app_<shortname>`:
- create `<schema>.app_<shortname>_analysis_runs`
- create `<schema>.app_<shortname>_audit`
- grant schema/table/sequence privileges to `anon`, `authenticated`, `service_role`
- set default privileges
- expose schema in Data API.

## Current delivery status
- Day 1: `submission-triage-copilot` deployed
- Day 2: `portfolio-mix-dashboard` deployed
- Day 3: `risk-appetite-parser` deployed
- Day 4: `slip-reviewer` deployed
- Day 5: `class-of-business-classifier` deployed and DB/audit verified
- Day 6: `exposure-accumulation-heatmap` deployed with real world basemap + subtle auto-zoom
- Day 7: `cat-event-briefing` deployed and verified
- Day 8: `policy-endorsement-diff-checker` deployed and verified
- Day 9: `referral-priority-queue-scorer` deployed and verified
- Day 10: `claims-fnol-triage-assistant` deployed and verified
- Day 11: implementation completed and integrated
- Day 12: `treaty-structure-explainer` implemented with deterministic parsing + persistence + audit
- Day 13: `exposure-clash-detector` implemented with overlap severity + persistence + audit
- Day 14: `claims-leakage-flagger` implemented with leakage rules + persistence + audit

## Analytics rollout
- Statcounter rollout completed on 2026-03-21 across all app layouts via official `@statcounter/nextjs`.
- Shared implementation:
  - `packages/common-ui/src/statcounter-analytics.tsx`
  - exported via `packages/common-ui/src/index.ts`
- Included in every app root layout (`apps/*/src/app/layout.tsx`) in production mode.
- Default Statcounter credentials currently configured in shared component:
  - project id: `13211903`
  - security code: `72173381`

## Social content pack status
- LinkedIn pack generated in `content/`:
  - `content/index.html` master browser page
  - `content/posts.json` canonical post dataset
  - `content/posts/` per-post HTML + Markdown
  - `content/assets/` diagrams, animations (`.gif` + `.mp4`), logos, and Day 1-10 screenshots
- Copy standard: UK English only.
- Current publishing strategy: post initial foundations plus Day 0 and Day 1 first, then continue with daily day-app posts and section posts as needed.

## Key file references
- Global checklist: `docs/app-build-quality-checklist.md`
- Lessons: `docs/lessons-learned.md`
- Critical memory: `docs/rag/critical-memory.md`
- Guardrails: `docs/rag/guardrails.md`
- Day 5 handoff: `docs/handoffs/day5-class-of-business-classifier-handoff-2026-03-18.md`
- Day 6 plan: `docs/day-6-execution-plan.md`

## Standard commands
Install:
- `pnpm install`

Per-app local run:
- `pnpm --filter @ai-ops/<app-name> dev`

Per-app quality gates:
- `pnpm --filter @ai-ops/<app-name> lint`
- `pnpm --filter @ai-ops/<app-name> test`
- `pnpm --filter @ai-ops/<app-name> typecheck`
- `pnpm --filter @ai-ops/<app-name> build`

Deploy shortcuts:
- `pnpm deploy:day1`
- `pnpm deploy:day2`
- `pnpm deploy:day3`
- `pnpm deploy:day4`
- `pnpm deploy:day5`
- `pnpm deploy:day6`

RAG sync:
- `pnpm rag:sync-all`

## How another agent should resume safely
1. Read this file + checklist + latest day plan/handoff before editing.
2. Verify local server ports and do not touch OpenWebUI on `3000`.
3. Run quality gates before claiming completion.
4. Capture visual evidence for desktop/mobile.
5. Confirm DB persistence + audit rows for the latest run.
6. Update docs (`lessons`, `critical-memory`, handoff) and run RAG sync.

## Notes for external assistants (Perplexity/Claude)
- Treat this project as implementation-first with deterministic behavior over speculative LLM output.
- Do not propose UI changes that break symmetry and spacing rhythm established in Day 3-6.
- Do not remove audit logging; extend it consistently for new apps.

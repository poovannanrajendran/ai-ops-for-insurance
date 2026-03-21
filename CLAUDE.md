# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 30-day challenge building 30 AI-powered Next.js apps for the London Market / specialty insurance domain. Each day produces one app under `apps/`, deployed independently to Vercel. **Days 1–11 are complete and deployed.**

## Critical Environment Rules

- Port `3000` is permanently reserved for OpenWebUI on this machine — never stop or reuse it.
- Use app-specific alternate ports for local dev (e.g. Day 1: `3001`, Day 5: `3005`, Day 6: `3006`).

## Common Commands

Run from repo root unless noted.

```sh
# Development (always use app-specific port, never 3000)
pnpm --filter @ai-ops/<app-name> dev

# Per-app quality gates (run all before marking complete)
pnpm --filter @ai-ops/<app-name> lint
pnpm --filter @ai-ops/<app-name> test
pnpm --filter @ai-ops/<app-name> typecheck
pnpm --filter @ai-ops/<app-name> build

# Run all at once
pnpm lint && pnpm test && pnpm typecheck && pnpm build

# Deployment
pnpm predeploy:check                           # Run pre-deployment checks
pnpm deploy:day<N>                             # Deploy a specific day (1–11 have shortcuts)
pnpm deploy:app <folder-name>                  # Deploy any app by folder name

# Scaffolding
pnpm scaffold:day-app                          # Generate a new day's app scaffold

# RAG memory (run after every meaningful doc/code change)
pnpm rag:sync-all                              # Sync all projects
pnpm rag:sync-all -- --purge true              # Full re-ingest
pnpm rag:sync-all -- --project ai-ops-for-insurance   # Single project
pnpm rag:query -- --project ai-ops-for-insurance --q "<query>" --k 8

# Symphony agent automation
pnpm symphony:install && pnpm symphony:doctor  # Setup check
pnpm symphony:run / pnpm symphony:stop

# Formatting
pnpm format && pnpm format:md && pnpm lint:md
```

## Delivery Status (as of 2026-03-20)

| Day | App folder | Status |
|-----|------------|--------|
| 1 | `submission-triage-copilot` | Deployed |
| 2 | `portfolio-mix-dashboard` | Deployed |
| 3 | `risk-appetite-parser` | Deployed |
| 4 | `slip-reviewer` | Deployed (schema: `app_slipreviewer`) |
| 5 | `class-of-business-classifier` | Deployed (schema: `app_classofbusiness`) |
| 6 | `exposure-accumulation-heatmap` | Deployed (real world basemap + auto-zoom) |
| 7 | `cat-event-briefing` | Deployed |
| 8 | `policy-endorsement-diff-checker` | Deployed |
| 9 | `referral-priority-queue-scorer` | Deployed |
| 10 | `claims-fnol-triage-assistant` | Deployed |
| 11 | `binder-capacity-monitor` | Complete |
| 12–30 | — | To be built |

## Architecture

### Monorepo Layout

```
apps/                   # 30 Next.js apps (one per day)
packages/
  lib/                  # @ai-ops/lib — logging, Supabase client factory, AI helpers, test utils
  common-ui/            # @ai-ops/common-ui — shared React components
  config/               # @ai-ops/config — env var reading/validation via Zod
infra/rag/              # RAG infrastructure: Qdrant (vectors) + Postgres (metadata)
docs/
  rag/                  # RAG operating model, guardrails, critical-memory, cross-agent brief
  handoffs/             # Per-day handoff docs (days 3–6 exist)
  app-build-quality-checklist.md
  lessons-learned.md
scripts/                # Deployment, scaffolding, Symphony, RAG scripts
content/                # LinkedIn content pack (32 posts, assets, index.html)
```

### Per-App Layered Architecture (enforced)

```
types/           # TypeScript interfaces
repositories/    # Data access — Supabase queries only
services/        # Business logic
app/api/         # Next.js API routes at /api/<shortname>/<endpoint>
app/             # React UI (use @ai-ops/common-ui for consistency)
```

### Supabase Naming Conventions

- Schema: `app_<shortname>`
- Analysis table: `app_<shortname>_analysis_runs`
- Audit table: `app_<shortname>_audit`

After creating a schema: grant privileges to `anon`, `authenticated`, `service_role`; set default privileges; expose in Data API.

### API Response Shape (required)

Every API route must return: `requestId`, `processingTimeMs`, `persistence.status`.

### Audit Stages (required, non-blocking)

Every route handler must write these stages at minimum:
- `request_received`
- `validation_failed` (on bad input)
- `analysis_completed` / `analysis_failed`

### Shared Packages

- **@ai-ops/lib** — structured logging (always pass `appKey` + `requestId`), Supabase client factory, AI model helpers with cost-tier routing
- **@ai-ops/config** — environment variable access validated by Zod
- **@ai-ops/common-ui** — shared React components; peer-depends on React 19

### Tech Stack

- **Node.js**: >= 20.9.0 (22 LTS recommended), **pnpm** 10.32.1
- **Framework**: Next.js 16 + React 19 + TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 — preserve symmetry/spacing rhythm from Day 3–6
- **Database**: Supabase (Postgres)
- **Testing**: Vitest 4 with jsdom
- **Deployment**: Vercel (one separate project per app)

### Vercel Monorepo Config (critical)

For each app project on Vercel:
- **Root Directory**: `apps/<app-folder>`
- **Framework**: Next.js
- **Output Directory**: empty (never set to "public")
- **Install command**: `pnpm install --frozen-lockfile --dir ../..`
- **Build command**: `pnpm --dir ../.. --filter @ai-ops/<app-name> build`
- **Required env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## RAG Memory System

RAG provides persistent cross-session memory. **Run `pnpm rag:sync-all` after every meaningful change.**

Key RAG docs (ingest targets):
- `docs/rag/critical-memory.md` — operational notes, port assignments, verified facts
- `docs/rag/cross-agent-rag-brief.md` — canonical context brief for new AI sessions (read this first)
- `docs/rag/guardrails.md` — scope, data, quality, and retrieval guardrails
- `docs/rag/operating-model.md` — standard sync/query workflow
- `docs/rag/projects.json` — project manifest for sync

### How to Resume Safely (any agent)

1. Read `docs/rag/cross-agent-rag-brief.md` + `docs/app-build-quality-checklist.md` before editing.
2. Check `docs/rag/critical-memory.md` for port assignments and known gotchas.
3. Run all quality gates before claiming completion.
4. Capture desktop + mobile screenshots for visual QA.
5. Confirm DB persistence + audit rows exist for the latest run.
6. Update `docs/lessons-learned.md`, `docs/rag/critical-memory.md`, and create a handoff doc.
7. Run `pnpm rag:sync-all` to persist the updated context.

## Linear Integration

Linear tracks per-day app issues under project slug `ai-ops-for-insurance-30-day-challenge-b35a68163a2d`. Symphony agents poll Linear for new issues and execute them via Codex (one coding objective per issue, max 8 turns).

## Environment Variables

Copy `.env.example` to `.env.local`. Key variables:

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VERCEL_TOKEN
LINEAR_API_KEY                # Symphony only
SYMPHONY_WORKSPACE_ROOT       # Symphony only
```

## Key Docs

- `docs/rag/cross-agent-rag-brief.md` — start here for context on any new session
- `ARCHITECTURE_OVERVIEW.md` — naming conventions, layered architecture, logging invariants
- `Master_Prompt.md` — full 30-day app schedule, naming conventions, agent instructions
- `WORKFLOW.md` — Symphony/Codex agent configuration
- `docs/app-build-quality-checklist.md` — mandatory pre-deploy checklist
- `docs/lessons-learned.md` — accumulated lessons across days

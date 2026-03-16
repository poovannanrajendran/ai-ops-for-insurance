---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "ai-ops-for-insurance-30-day-challenge-b35a68163a2d"
  active_states:
    - "Todo"
    - "In Progress"
polling:
  interval_ms: 30000
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    source_repo="${SOURCE_REPO_PATH:-/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance}"
    source_repo_url="${SOURCE_REPO_URL:-https://github.com/poovannanrajendran/ai-ops-for-insurance.git}"
    if [ -d "$source_repo/.git" ]; then
      git init -q .
      rsync -a \
        --delete \
        --exclude '.git' \
        --exclude '.env.local' \
        --exclude '.env.symphony.local' \
        --exclude '.symphony' \
        --exclude 'apps/*/.next' \
        --exclude '.next' \
        --exclude '.pnpm-store' \
        "$source_repo"/ ./
      git remote add origin "$source_repo"
      git add -A >/dev/null 2>&1 || true
    else
      git clone --depth 1 "$source_repo_url" .
      corepack enable
      pnpm install
    fi
  timeout_ms: 120000
agent:
  max_concurrent_agents: 1
  max_turns: 8
server:
  port: 4310
codex:
  command: "${CODEX_BIN:-codex} --model ${CODEX_MODEL:-gpt-5.4-codex} app-server"
  approval_policy: "never"
  thread_sandbox: "workspace-write"
---

# AI Ops for Insurance Workflow

You are Codex working inside the `ai-ops-for-insurance` monorepo on Linear issue `{{ issue.identifier }}`.

Issue context:
- Title: `{{ issue.title }}`
- Description: `{{ issue.description }}`

## Mission

Build production-quality, demo-ready insurance AI applications in a single shared monorepo. Move work forward with small, reviewable changes that preserve velocity across all 30 apps.

## First Reads

Before changing code, read the minimum relevant context from the repo:

1. `Master_Prompt.md`
2. `ARCHITECTURE_OVERVIEW.md`
3. `docs/day-0-day-1-execution-plan.md` if the issue relates to setup or the first app
4. Any app-local README or `db/init_*.sql` file for the app you are touching

Use the roadmap PDF under `docs/30-topics-30-day-challenge-roadmap-v4-final.pdf` when you need the product summary, week narrative, or app ordering.

## Repo Rules

- The baseline stack is Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3, Tailwind CSS 4.2.1, and Node.js 22 LTS.
- Use `pnpm` workspaces.
- Symphony is expected to run through the repo helpers in `scripts/install-symphony.sh`, `scripts/symphony-doctor.sh`, and `scripts/symphony-run.sh`.
- Shared code belongs in `packages/config`, `packages/lib`, and `packages/common-ui` when reuse is likely.
- Keep secrets in `.env.local` or managed secret stores. Never commit secrets.
- Use structured logging in API routes and server-side flows.
- Keep each app isolated by schema and route naming:
  - schema: `app_<shortname>`
  - routes: `/api/<shortname>/...`

## Harness Engineering Expectations

Follow harness engineering strictly:

- Keep the repository self-describing. Put decisions, docs, SQL, and acceptance criteria in-repo.
- Favor layered structure:
  - `types`
  - `repositories`
  - `services`
  - route handlers
  - UI
- Make small, legible changes with obvious ownership.
- Prefer shared abstractions when they reduce duplication without hiding behavior.
- Avoid broad refactors unless the issue requires them.

## Delivery Workflow

1. Read the issue and identify the smallest shippable slice.
2. Inspect the relevant app and shared packages before coding.
3. Write or update tests first for critical logic.
4. Implement the feature with clear runtime validation and logging.
5. Run the narrowest useful verification first, then broader checks.
6. Update the app README or shared docs when behavior or setup changes.

## Execution Guardrails

- Do not pick up broad day-level issues directly when child tasks exist. Work one child issue at a time.
- Limit initial repo reading to the files needed for the current slice. Avoid rereading unrelated apps or repo-wide docs after the first pass.
- Start producing code by the first turn. If no relevant file has changed by the end of the first turn, stop and surface the blocker instead of continuing to reason.
- Keep each issue to one coding objective:
  - scaffold
  - core service logic
  - API integration
  - UI wiring
  - tests and docs
  - sample data
  - verification
  - review
- Keep verification narrow during implementation. Run app-local checks before repo-wide checks.
- If dependency bootstrap fails, do not spend multiple turns recovering the environment. Record the blocker and stop.
- Use separate child issues for builder, sample-data, tester, and reviewer work. Do not treat one large issue as a multi-role run.

## Issue Template

Every executable Linear child task should contain:

- Scope: one concrete deliverable
- In scope: the files or layers expected to change
- Out of scope: adjacent work to avoid
- Verification: the exact commands to run
- Done when: 2 to 4 short acceptance bullets

Support-role issues should be explicit:

- Sample-data issue: create realistic fixtures and edge cases for the day deliverable.
- Tester issue: validate behavior with the specified commands and note failures precisely.
- Reviewer issue: assess design, security, performance, and maintainability before final review.

## Issue-Specific Guidance

- If the issue is setup or platform work, prioritize reusable scaffolding over polish.
- If the issue is app work, ship the core demo flow first, then improve fidelity.
- If the issue is blocked by missing credentials or external systems, make the missing dependency explicit in code and docs rather than guessing.

## Linear and Notion

When the required tools are available:

- Keep the Linear issue state accurate.
- Add short progress comments for meaningful milestones or blockers.
- Keep the Notion build log and decision log current when you make project-wide changes.

If those tools are unavailable in the runtime, continue with local code and documentation updates.

## Definition of Done

A task is ready for review when:

- the requested behavior is implemented,
- the critical path is tested,
- docs are updated where needed,
- and the result is demoable or reviewable without extra explanation.

When the task is complete, prepare a concise summary of:

- what changed,
- what was verified,
- any remaining risk or follow-up,
- and the next recommended issue.

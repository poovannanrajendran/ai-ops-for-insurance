# Day 0 and Day 1 Execution Plan

## Scope

This plan compresses **Day 0 bootstrap** and **Day 1 app delivery kickoff** into a single execution day on **March 15, 2026** so the challenge is back on schedule by end of day. It uses the roadmap in [`docs/30-topics-30-day-challenge-roadmap-v4-final.pdf`](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/docs/30-topics-30-day-challenge-roadmap-v4-final.pdf) and the repo conventions in [`Master_Prompt.md`](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/Master_Prompt.md).

## Locked Decisions

As of **March 15, 2026**, the stack baseline is:

| Area | Version / Choice | Why |
| --- | --- | --- |
| Node.js | 22 LTS | Already installed locally and comfortably satisfies Next.js requirements. |
| Package manager | `pnpm` | Better workspace ergonomics for 30 apps than plain npm. |
| Next.js | 16.1.6 | Latest stable on npm today. |
| React | 19.2.4 | Matches current Next.js line. |
| TypeScript | 5.9.3 | Latest stable on npm today. |
| Tailwind CSS | 4.2.1 | Latest stable on npm today. |
| Testing | Vitest + React Testing Library | Fast feedback for app and shared package tests. |
| Database | Single Supabase project, per-app schemas | Matches roadmap and prompt guidance. |
| Deployment | Vercel Hobby | Matches roadmap and keeps deployment friction low. |

## Day 0

Goal: finish the reusable foundation once so the next 29 apps are mostly feature work.

### Deliverables

1. Root workspace bootstrap:
   - Configure `pnpm-workspace.yaml`.
   - Replace the placeholder root `package.json` with monorepo scripts for `dev`, `test`, `lint`, `typecheck`, and filtered app commands.
   - Add shared TypeScript base config and common lint/format setup.
2. Shared package skeletons:
   - `packages/config` for environment parsing and naming conventions.
   - `packages/lib` for logging, Supabase server client, AI helper, and test utilities.
   - `packages/common-ui` for reusable UI primitives.
3. Application generator baseline:
   - Create the first app folder structure under `apps/submission-triage-copilot`.
   - Define the standard folder template every later app will copy.
4. Secret and environment posture:
   - Keep secrets in `.env.local`, not `.env`.
   - Keep `.env.example` placeholder-only.
   - Document which values belong in local env versus Vercel project settings.
5. Supabase bootstrap decisions:
   - Confirm project region is London / `eu-west-2`.
   - Establish `app_shared` plus per-app schema naming convention.
   - Write the first idempotent SQL bootstrap pattern for later reuse.
6. Delivery harness:
   - Confirm Vercel project strategy: one project per app.
   - Confirm local dev port convention to avoid collisions as apps multiply.
   - Add a simple app metadata convention for the future portfolio showcase.

### Timebox

1. `09:00-09:45`: Workspace bootstrap and package manager setup.
2. `09:45-10:30`: Shared packages and config skeletons.
3. `10:30-11:15`: Testing, linting, and typecheck baseline.
4. `11:15-12:00`: Supabase/env conventions and first SQL bootstrap template.

### Definition of Done

- Root workspace commands run successfully.
- Shared packages compile.
- `apps/submission-triage-copilot` exists with a runnable skeleton.
- No secrets are committed.
- The repo has one clear golden path for all subsequent apps.

## Day 1

Goal: ship the first high-signal app, `submission-triage-copilot`, as a real vertical slice, not just scaffolding.

### Product Intent

From the roadmap, the app must:

- Accept broker submission documents.
- Extract key fields.
- Score the risk against appetite.
- Return `accept`, `refer`, or `decline` with reasoning.
- Be demoable end-to-end in 2 to 3 minutes.

### MVP Scope for Today

1. Input modes:
   - Text paste for the first working version.
   - File upload interface stubbed if document extraction is not finished today.
2. Core workflow:
   - Submission intake form.
   - Extraction service returning structured fields.
   - Rules plus LLM-assisted appetite scoring.
   - Decision card with explanation and confidence.
3. Persistence:
   - Save submission summary, extracted fields, decision, and timestamps in Supabase.
4. Observability:
   - Structured logs on request start, extraction result, scoring result, and failure path.
5. Tests:
   - Unit tests for scoring logic.
   - Route tests for valid and invalid submission input.
   - UI smoke test for the happy path.

### Engineering Breakdown

1. App structure:
   - `src/app/page.tsx` for the single-screen demo flow.
   - `src/app/api/submissiontriage/analyze/route.ts` for the main analysis endpoint.
   - `repositories/`, `services/`, and `types/` folders inside the app.
2. Data model:
   - `app_submissiontriage.app_submissiontriage_core`
   - `app_submissiontriage.app_submissiontriage_audit`
3. Service boundaries:
   - `extractSubmissionFields`
   - `scoreAgainstAppetite`
   - `persistSubmissionDecision`
4. Acceptance criteria:
   - A user can submit sample text and receive a decision.
   - The response includes extracted fields and rationale.
   - The result is stored.
   - Tests pass locally.

### Timebox

1. `13:00-13:45`: Finalize app architecture and test plan.
2. `13:45-15:00`: Implement tests and core scoring service.
3. `15:00-16:30`: Build UI, route handler, and persistence.
4. `16:30-17:15`: Run tests, tighten logging, and fix rough edges.
5. `17:15-18:00`: Local demo run, README draft, and deploy preparation.

### Definition of Done

- The app runs locally.
- The happy path is demoable in under 3 minutes.
- Tests covering the critical path pass.
- The README explains purpose, flow, setup, and demo steps.
- The app is ready for Vercel deployment immediately after local validation.

## Today’s Execution Order

1. Finish Day 0 foundation first.
2. Immediately scaffold `submission-triage-copilot` on top of that foundation.
3. Ship the Day 1 MVP before adding polish such as drag-and-drop upload, richer parsing, or multi-document orchestration.
4. If time remains, prepare the Day 2 app scaffold so tomorrow starts with product logic, not setup.

## Docker MCP Review

Docker Desktop has local MCP registry entries for `SQLite`, `dockerhub`, `hostinger-mcp-server`, `memory`, `mongodb`, `notion`, and `playwright`.

Useful for this repo:

- `playwright`: useful for local UI review, but this Codex session already has direct Playwright tools, so the Docker-managed copy adds no immediate advantage.
- `notion`: useful only if you want roadmap notes or decisions mirrored to Notion. This Codex session already has direct Notion tools too.
- `dockerhub`: useful later if we containerize shared tooling, want to inspect base images, or publish a reusable developer image.
- `SQLite`: potentially useful for a lightweight local planning or metadata store, but not needed for the product builds because the challenge standard is Supabase.

Not useful for Day 0 or Day 1:

- `mongodb`: off-plan for this challenge, since the repo standard is Supabase.
- `hostinger-mcp-server`: not part of the delivery path while the roadmap standard is Vercel.
- `memory`: optional convenience only; it does not unblock workspace bootstrap or the first app build.

Conclusion: **do not make Docker MCP part of the Day 0 critical path**. The direct Codex tools plus local Docker CLI are enough for the first two days.

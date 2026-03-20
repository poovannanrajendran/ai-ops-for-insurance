# 30-Day Insurance AI Challenge

This repository houses **30 small AI-powered applications** developed over a 30-day period. Each app solves a specific problem in the London Market and specialty insurance domain, such as underwriting, exposure management, claims operations, broking, productivity, or leadership. The challenge is inspired by the Lloyd's digital transformation agenda and is designed to showcase practical AI-Ops and product management skills.

## Goals

1. **Demonstrate real-world value**: Each application addresses a concrete pain point, such as automating submission intake, summarizing claims events, generating exposure heatmaps, or drafting renewal memos. The apps are intended to be demoable end-to-end in 2-3 minutes.
2. **Adhere to sound engineering practices**: Test-driven development, structured logging, and observability are built in from day one. The repository follows harness-engineering principles so future agents can autonomously extend the codebase.
3. **Showcase product thinking**: Each app's README explains the problem, target persona, architecture, and value proposition. This portfolio illustrates how AI can augment roles across underwriting, claims, and broking.

## Repository Layout

```text
.
├── apps/                  # One folder per application (30 total)
│   ├── submission-triage-copilot/
│   ├── portfolio-mix-dashboard/
│   ├── risk-appetite-parser/
│   ├── slip-reviewer/
│   ├── class-of-business-classifier/
│   ├── exposure-accumulation-heatmap/
│   ├── cat-event-briefing/
│   ├── policy-endorsement-diff-checker/
│   ├── referral-priority-queue-scorer/
│   ├── claims-fnol-triage-assistant/
│   ├── binder-capacity-monitor/
│   └── ...
├── packages/
│   ├── lib/               # Shared utilities: logging, Supabase client, AI helper
│   ├── common-ui/         # Reusable React components (buttons, tables, charts)
│   └── config/            # Centralized configuration (env reading, constants)
├── docs/
│   └── 30-topics-30-day-challenge-roadmap-v4-final.pdf
├── ARCHITECTURE_OVERVIEW.md
├── WORKFLOW.md
├── Master_Prompt.md
└── README.md
```

Each app in `apps/` is intended to be a stand-alone **Next.js latest stable** project. As of **March 15, 2026**, the baseline stack is **Next.js 16.1.6**, **React 19.2.4**, **TypeScript 5.9.3**, and **Tailwind CSS 4.2.1**. Apps share common code via packages under `packages/`. A shared Supabase project can be used across all apps, with separate schemas and tables per app following the naming convention `app_<shortname>_*`.

Current deployed app endpoints:

- Day 1 `submission-triage-copilot`: `https://submission-triage-copilot.vercel.app`
- Day 2 `portfolio-mix-dashboard`: `https://portfolio-mix-dashboard.vercel.app`
- Day 3 `risk-appetite-parser`: `https://risk-appetite-parser.vercel.app`
- Day 4 `slip-reviewer`: `https://slip-reviewer.vercel.app`
- Day 5 `class-of-business-classifier`: `https://class-of-business-classifier.vercel.app`
- Day 6 `exposure-accumulation-heatmap`: `https://exposure-accumulation-heatmap.vercel.app`
- Day 7 `cat-event-briefing`: `https://cat-event-briefing.vercel.app`
- Day 8 `policy-endorsement-diff-checker`: pending deployment
- Day 9 `referral-priority-queue-scorer`: pending deployment
- Day 10 `claims-fnol-triage-assistant`: pending deployment
- Day 11 `binder-capacity-monitor`: pending deployment

## Prerequisites

- **Node.js 22 LTS** is recommended. Next.js 16.1.6 requires **Node.js >= 20.9.0**.
- A **Supabase** account with a single project created for this challenge. Store `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in a local `.env.local` file and keep additional per-app secrets in Vercel environment variables or another secret manager.
- A **Vercel** account for deploying the Next.js apps.
- Optional: **Linear** and **Symphony** for agent-assisted development.

## Getting Started

1. Clone the repository into your GitHub folder:

   ```sh
   cd /Users/poovannanrajendran/Documents/GitHub
   git clone <repo-url> ai-ops-for-insurance
   cd ai-ops-for-insurance
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Copy the example environment variables and set your Supabase credentials:

   ```sh
   cp .env.example .env.local
   ```

   Then edit `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

4. Run an app locally. For example:

   ```sh
   pnpm --filter @ai-ops/submission-triage-copilot dev
   ```

   Then visit `http://localhost:3001`.

5. Deploy to Vercel. From the app folder, run:

   ```sh
   vercel --prod
   ```

   Ensure the required environment variables are set in the Vercel project settings before deployment.

   Or use root shortcuts:

   ```sh
   pnpm deploy:day1
   pnpm deploy:day2
   pnpm deploy:day3
   pnpm deploy:day4
   pnpm deploy:day5
   pnpm deploy:day6
   pnpm deploy:day7
   pnpm deploy:day8
   pnpm deploy:day9
   pnpm deploy:day10
   pnpm deploy:day11
   ```

   For new apps:

   ```sh
   pnpm deploy:app <app-folder-name>
   ```

### Vercel Monorepo Setup (Important)

For each app, create a separate Vercel project and configure:

- `Root Directory`: `apps/<app-folder>`
- `Framework Preset`: `Next.js`
- `Output Directory`: leave empty (do not set `public`)

If `Output Directory` is set to `public`, Vercel treats the app as static output and fails with:
`No Output Directory named "public" found after the Build completed.`

### PNPM Build Script Warning

If Vercel logs show:
`Ignored build scripts: sharp@... Run "pnpm approve-builds"...`

This repo already whitelists `sharp` via `pnpm-workspace.yaml` (`onlyBuiltDependencies`).
If the warning still appears in an existing build cache, trigger a fresh redeploy after the latest commit.

## Symphony

This repo is configured to run the official OpenAI Symphony Elixir reference runtime against the repo-owned [WORKFLOW.md](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/WORKFLOW.md).

1. Install or refresh the local Symphony runtime:

   ```sh
   pnpm symphony:install
   ```

2. Export the required orchestration environment:

   ```sh
   export LINEAR_API_KEY=...
   export SYMPHONY_WORKSPACE_ROOT="$HOME/Documents/GitHub/symphony-workspaces/ai-ops-for-insurance"
   ```

   Or store the same values in `.env.local` or `.env.symphony.local` if you want the repo scripts to load them automatically.

   Optional overrides:

   ```sh
   export SYMPHONY_HOME="$HOME/.local/share/openai-symphony"
   export SYMPHONY_PORT=4310
   export SOURCE_REPO_URL="git@github.com:poovannanrajendran/ai-ops-for-insurance.git"
   ```

3. Check the local setup:

   ```sh
   pnpm symphony:doctor
   ```

4. Start Symphony:

   ```sh
   pnpm symphony:run
   ```

The repo runner already includes Symphony's required preview acknowledgment flag. It also starts a local watchdog that can terminate the runtime if token burn stays high without code changes. The optional dashboard is exposed on `http://localhost:4310` by default.

See [docs/symphony-execution-playbook.md](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/docs/symphony-execution-playbook.md) for the task-splitting and operator workflow.

Useful operations:

```sh
pnpm symphony:stop
tail -f .symphony/runtime.log
tail -f .symphony/watchdog.log
cat .symphony/watchdog-last-stop.json
```

Useful watchdog overrides:

```sh
export SYMPHONY_WATCHDOG_HARD_MAX_TOTAL_TOKENS=400000
export SYMPHONY_WATCHDOG_HARD_MAX_ISSUE_TOKENS=250000
export SYMPHONY_WATCHDOG_NO_CODE_RUNTIME_MS=60000
export SYMPHONY_WATCHDOG_NO_CODE_TOKEN_FLOOR=80000
```

## Shared RAG Memory

Shared RAG infrastructure is under [`infra/rag`](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/infra/rag/README.md) and supports:

- cross-project persistence in a dedicated Postgres DB (`ai_ops_rag`)
- project-specific retrieval via `project_key` filters
- Qdrant vector search with optional OpenAI embeddings

Commands:

```sh
pnpm rag:ingest -- --project ai-ops-for-insurance --name "AI Ops for Insurance"
pnpm rag:query -- --project ai-ops-for-insurance --q "port 3000 openwebui" --k 5
```

Operational rule:

1. Split each day into child issues before turning Symphony on.
2. Move only one child issue into `Todo` or `In Progress`.
3. Keep the parent day issue out of active states until the child tasks are complete.

## Contributing

This challenge is structured for both human contributors and agentic coding assistants.

1. Create a Linear issue describing the work to be done.
2. Assign the issue to yourself, or let Symphony pick it up from the Linear project queue.
3. Write tests first, then implement the code. Use structured logging and shared utilities.
4. Commit with a descriptive message referencing the Linear issue key, then open a pull request.
5. After review, merge the PR, deploy the app, and update its README if necessary.

## Next Steps

Refer to [WORKFLOW.md](WORKFLOW.md) for detailed guidelines on development, testing, and deployment. For a high-level view of the architecture and cross-cutting concerns, see [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md).

Default execution quality standard for all new apps:
- [docs/app-build-quality-checklist.md](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/docs/app-build-quality-checklist.md)

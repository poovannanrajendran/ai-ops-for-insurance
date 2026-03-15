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

Each app in `apps/` is intended to be a stand-alone **Next.js 14** project. Apps share common code via packages under `packages/`. A shared Supabase project can be used across all apps, with separate schemas and tables per app following the naming convention `app_<shortname>_*`.

## Prerequisites

- **Node.js v18+** and **pnpm** or **npm v7+**. This repo uses workspaces to manage packages.
- A **Supabase** account with a single project created for this challenge. Copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env` at the repo root. Additional per-app secrets, such as API keys, should be stored in Vercel environment variables.
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
   cp .env.example .env
   ```

   Then edit `.env` and set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

4. Run an app locally. For example:

   ```sh
   pnpm --filter @apps/submission-triage-copilot dev
   ```

   Then visit `http://localhost:3000`.

5. Deploy to Vercel. From the app folder, run:

   ```sh
   vercel --prod
   ```

   Ensure the required environment variables are set in the Vercel project settings before deployment.

## Contributing

This challenge is structured for both human contributors and agentic coding assistants.

1. Create a Linear issue describing the work to be done.
2. Assign the issue to yourself, or let Symphony pick it up.
3. Write tests first, then implement the code. Use structured logging and shared utilities.
4. Commit with a descriptive message referencing the Linear issue key, then open a pull request.
5. After review, merge the PR, deploy the app, and update its README if necessary.

## Next Steps

Refer to [WORKFLOW.md](WORKFLOW.md) for detailed guidelines on development, testing, and deployment. For a high-level view of the architecture and cross-cutting concerns, see [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md).

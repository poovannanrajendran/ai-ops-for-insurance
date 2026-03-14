# 30‑Day Insurance AI Challenge

This repository houses **30 small AI‑powered applications** developed over a 30‑day period.  Each app solves a specific problem in the London Market / specialty insurance domain, such as underwriting, exposure management, claims operations, broking, productivity or leadership.  The challenge is inspired by the Lloyd’s digital transformation agenda and is designed to showcase practical AI‑Ops and product management skills.

## Goals

1. **Demonstrate real‑world value**: Each application addresses a concrete pain point—e.g., automating submission intake, summarising claims events, generating exposure heatmaps or crafting renewal memos.  The apps are intended to be demoable end‑to‑end in 2–3 minutes.
2. **Adhere to sound engineering practices**: Test‑driven development, structured logging, and observability are built in from day one.  The repository follows harness‑engineering principles so that future agents can autonomously extend the codebase.
3. **Showcase product thinking**: Each app’s README explains the problem, target persona, architecture and value proposition.  This portfolio illustrates how AI can augment roles across underwriting, claims and broking.

## Repository layout

.
├── apps/               # One folder per application (30 total)
│   ├── submission‑triage‑copilot/
│   ├── portfolio‑mix‑dashboard/
│   └── …
├── packages/
│   ├── lib/            # Shared utilities: logging, Supabase client, AI helper
│   ├── common‑ui/      # Reusable React components (buttons, tables, charts)
│   └── config/         # Centralised configuration (env reading, constants)
├── docs/
│   └── ARCHITECTURE_OVERVIEW.md  # High‑level design and principles
├── WORKFLOW.md         # Development and deployment workflow
├── MASTER_PROMPT.md    # Master instructions for Codex/agentic assistants
└── README.md           # This file

Code: 
Each app in `apps/` is a stand‑alone **Next.js 14** project.  Apps share common code via packages under `packages/`.  The **shared Supabase project** is used across all apps, with separate schemas and tables per app following the naming convention `app_<shortname>_*`.

## Prerequisites

- **Node.js v18+** and **pnpm** (or npm v7+).  This repo uses workspaces to manage packages.
- **Supabase** account with a single project created for this challenge.  Copy the `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env` at the root.  Additional per‑app secrets (e.g., API keys) are stored in Vercel environment variables.
- **Vercel account** for deploying the Next.js apps.
- (Optional) **Linear** account and **Symphony** for agent‑assisted development.

## Getting started

1. Clone the repository into your GitHub folder, e.g.:

   ```sh
   cd /Users/poovannanrajendran/Documents/GitHub
   # Clone into the `ai‑ops‑for‑insurance` folder
   git clone <repo‑url> ai‑ops‑for‑insurance
   cd ai‑ops‑for‑insurance```
   
2.	Install dependencies (using pnpm):
	pnpm install

3.	Copy the example environment variables and set your Supabase credentials:
	cp .env.example .env
	# edit .env to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

4.	Run an app locally.  Each app has its own dev script.  For example, to run the submission triage copilot:
	pnpm --filter @apps/submission‑triage‑copilot dev

Visit http://localhost:3000 to view the app.

5.	Deploy to Vercel.  From the app folder, run vercel --prod.  Ensure the required environment variables are set in the Vercel project settings before deployment.

Contributing

This challenge is structured for both human contributors and agentic coding assistants.  To contribute:
	1.	Create a Linear issue describing the work to be done.
	2.	Assign the issue to yourself (or let Symphony pick it up).
	3.	Write tests first, then implement the code.  Use structured logging and shared utilities.
	4.	Commit with a descriptive message referencing the Linear issue key, then open a pull request.
	5.	After review, merge the PR.  Deploy the app and update its README if necessary.

Next steps

Refer to WORKFLOW.md for detailed guidelines on development, testing and deployment.  For a high‑level view of the architecture and cross‑cutting concerns, see docs/ARCHITECTURE_OVERVIEW.md.

Enjoy building the future of insurance!	

---

### `WORKFLOW.md`

```markdown
# Development & Deployment Workflow

This document describes how to work within the **AI‑Ops‑for‑Insurance** monorepo.  It covers the end‑to‑end process from initial setup through local development, testing, deployment and collaboration with Symphony/Linear.

## 1. Pre‑development checklist

Before starting work on any app:

1. **Repository initialisation:** Ensure the monorepo exists under `/Users/poovannanrajendran/Documents/GitHub/ai‑ops‑for‑insurance` and has been pushed to GitHub.  The repo should include this `WORKFLOW.md`, `MASTER_PROMPT.md`, and the `docs/` directory.  Do **not** add a `vercel.json` file unless required—Vercel’s defaults suffice for Next.js.

2. **Supabase project:** Confirm that a single Supabase project has been created for the entire challenge.  Copy the `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env` at the repository root.

3. **Environment variables:** For each app, determine which third‑party API keys are required.  Store them in Vercel’s project settings using the prefix `APP_<SHORTNAME>_…`.

4. **Linear board:** If using Linear + Symphony, create a project or team for the challenge.  Add an epic for each app with an overview description.  Within each epic, create issues for design/requirements, API implementation, UI implementation, testing, logging/observability, deployment and documentation.  
   
   *Automation tip:* Rather than creating the board manually, you can automate the process by calling Linear’s GraphQL API via a Node script.  Use your Linear API key and a script like the example in the **Automated Linear setup via Codex** section below.

5. **Third‑party APIs:** Before coding, review the documentation for any external APIs (e.g. OpenAI, Lloyd’s feeds) and experiment with simple calls.

## Automated Linear setup via Codex

If you would like to create your **Linear** project, epics and issues programmatically, you can write a small Node script (or ask Codex to generate it) that calls Linear’s GraphQL API.  The high‑level steps are:

1. **Generate a Linear API key** in your Linear settings.
2. **Create a project** named “Insurance AI 30 Challenge” (or another name) via a GraphQL mutation.
3. **Iterate over the 30 app definitions** from the v4 roadmap to create an epic for each.  Include a brief summary in the epic description.
4. **Within each epic**, optionally create a standard set of issues—e.g. design/requirements, API implementation, UI implementation, testing, logging/observability, deployment and documentation.

Here is an example Node script using `node-fetch`:

```js
const fetch = require('node-fetch');

const apiKey = process.env.LINEAR_API_KEY;
const headers = {
  'Content-Type': 'application/json',
  Authorization: apiKey
};

async function createProject() {
  const mutation = `
    mutation {
      projectCreate(input: { name: "Insurance AI 30 Challenge", color: "#00A7E1" }) {
        success
        project { id name }
      }
    }
  `;
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation })
  });
  const data = await res.json();
  return data.data.projectCreate.project.id;
}

async function createEpic(projectId, name, description) {
  const mutation = `
    mutation ($projectId: String!, $name: String!, $description: String!) {
      issueCreate(input: { title: $name, description: $description, projectId: $projectId, teamId: null, assigneeId: null, priority: 0, labels: [] }) {
        success
        issue { id title }
      }
    }
  `;
  const variables = { projectId, name, description };
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables })
  });
  return (await res.json()).data.issueCreate.issue.id;
}

async function main() {
  const projectId = await createProject();
  const apps = [
    { name: 'submission‑triage‑copilot', description: 'Upload broker submission docs → extract key fields; score against risk appetite.' },
    // ...add other apps here
  ];
  for (const app of apps) {
    await createEpic(projectId, app.name, app.description);
  }
}

main().catch(console.error);




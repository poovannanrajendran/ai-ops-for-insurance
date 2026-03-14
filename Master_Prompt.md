# Master Prompt – 30‑Day Insurance AI Challenge

## Purpose

This master prompt is intended for use with **Codex** or other agentic coding assistants.  It describes the overall goals, architecture, conventions and constraints for the 30‑day challenge to build 30 small, AI‑powered applications for the London Market (Lloyd’s & specialty insurance).  Agents should refer back to this document whenever creating new files, writing code, tests, or documentation.

## Challenge Overview

You are tasked with creating **30 distinct, demo‑ready applications** that solve real problems in underwriting, exposure management, claims operations, broking, productivity, leadership and general insurance utilities.  Each application should be demoable end‑to‑end in **2–3 minutes**, deployed on the free tier of **Vercel**, and leverage a **shared Supabase** project for persistence.  The apps follow a value‑ordered schedule drawn from the v4 roadmap (attached separately).  All work should adhere to **test‑driven development (TDD)**, **structured logging**, **observability**, and **harness‑engineering** best practices.

## Repository Structure

Create a **monorepo** under the root folder (named `ai‑ops‑for‑insurance`, unless you explicitly choose another).  The top‑level structure should be:
ai‑ops‑for‑insurance/
├── apps/ # One subfolder per application
│ ├── submission‑triage‑copilot/
│ ├── portfolio‑mix‑dashboard/
│ └── … (28 more)
├── packages/
│ ├── lib/ # Shared utilities: logging, Supabase client, AI helpers
│ ├── common‑ui/ # Reusable React components (buttons, tables, charts)
│ └── config/ # Centralised configuration helpers
├── docs/ # Design docs, architecture overview
├── WORKFLOW.md # Agent/human workflow instructions (see below)
├── MASTER_PROMPT.md # This file – master instructions for Codex
└── README.md # Root project overview

code: 
**apps/** – Each folder under `apps/` is a **stand‑alone Next.js 14** application.  Use TypeScript, Tailwind CSS and Next.js **app router**.  Include a `db/` directory with an idempotent SQL script (`init_<appname>.sql`) that creates the required schema and tables in the shared Supabase project using the naming convention `app_<shortappname>_*`.  Each app has its own `src/app/page.tsx`, API routes under `src/app/api/<shortappname>/`, tests under `tests/`, and a mini README explaining its purpose, architecture and run instructions.

**packages/lib/** – Export shared utilities:

* **logging.ts** – A simple structured logger wrapper (e.g., using `console.log`) that accepts an `appKey` and metadata, producing JSON‑serialisable logs.
* **supabaseClient.ts** – A factory that returns a Supabase client given `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.  Use this in API routes only; never expose the service role key to the browser.
* **ai.ts** – Helper functions to call OpenAI or Anthropic models.  Expose a `callLLM({ model, messages, functions })` method.  Implement model routing: default to cheap models (e.g., `gpt‑5‑nano` or `gpt‑4.1‑mini`) for simple summarisation and extraction, and allow passing a higher‑capacity model (e.g., `gpt‑5.4‑codex`) for complex reasoning.
* **test‑utils.ts** – Shared test helpers (e.g., mocking the Supabase client and AI calls).

**packages/common‑ui/** – Include generic components (e.g., `Table`, `Card`, `Modal`, `Chart`) that all apps can import.  Style them with Tailwind and ensure they accept props for flexibility.

**packages/config/** – Centralise configuration (e.g., reading environment variables, exporting constants such as `SHARED_SCHEMA_PREFIX = 'app_'`).

## Naming Conventions

1. **Schemas**: Each app uses its own schema in Supabase named `app_<shortname>`.  Example: `app_submissiontriage`.
2. **Tables**: Prefix tables with the app key: e.g., `app_submissiontriage_core`, `app_submissiontriage_audit`.
3. **API routes**: Under `/api/<shortname>/<endpoint>`.  Log the start and end of every request, including important decisions and errors.
4. **Environment variables**: Shared variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) live at the repo root `.env`.  Per‑app secrets (e.g., `APP_<SHORTNAME>_OPENAI_KEY`) should be defined in Vercel and referenced via `process.env`.
5. **Logging**: Always include the `appKey` and `requestId` in log messages.  Do not log sensitive data (PII or confidential policy details).

## Process & Harness Engineering

Follow **harness‑engineering** principles to maximise agent legibility:
1. **Repository is the knowledge base** – Store all design docs, schemas, business rules and examples in `docs/` or Markdown files within the app folder.  Avoid off‑repo context.
2. **Layered architecture** – Within each app, separate types (`types/`), configuration (`config/`), repositories (database interactions), services (business logic), runtime (API routes) and UI (`src/app/`).  
3. **Structured logging & invariants** – Use the shared logger; ensure each API route validates inputs (e.g., using Zod).  Write tests for critical paths before implementation.
4. **Short‑lived PRs** – When Symphony creates a pull request, keep it focused on a single issue.  Humans review for correctness and architectural compliance.
5. **Documentation** – Each app includes its own README explaining the problem solved, architecture, run/deploy instructions and value to the London market.  Update `docs/ARCHITECTURE_OVERVIEW.md` whenever shared abstractions evolve.

## AI Models & Cost Management

Use the **OpenAI API** for language tasks and **Codex** models for code when appropriate.  Implement model routing in `packages/lib/ai.ts` based on task complexity and cost:

- **Cheap models** (`gpt‑5‑nano`, `gpt‑5‑mini`, `gpt‑4.1‑mini`): summarisation, simple extraction, basic classification.
- **Mid‑range models** (`gpt‑5.1`, `gpt‑5.2`, `gpt‑5.1‑codex`): multi‑step reasoning, moderate code generation.
- **High‑capacity models** (`gpt‑5.3‑codex`, `gpt‑5.4`, `gpt‑5.4‑codex`): complex document analysis, differential comparisons, long context reasoning.

Within each API route, specify the model via the helper; expose an override via an environment variable (e.g., `APP_<SHORTNAME>_MODEL`), falling back to the default tier.  Cache responses where appropriate to reduce cost.

## Linear & Symphony Integration

- Represent each **application as a Linear epic**.  Under each epic, create issues for planning, UI implementation, API implementation, testing, logging/observability, deployment and documentation.
- Write clear **acceptance criteria** in each issue (include expected endpoints, inputs/outputs, success criteria, test cases).
- Symphony monitors the Linear board; when an issue moves to **In Progress**, Symphony spawns a coding agent to implement the tasks.  Agents use this master prompt, the repo and issue context to guide their work.

## App Schedule & Summaries

The applications should be implemented in the following order (weekends marked with “WE”; weekdays with “WD”).  Each summary should be included in the app’s README and used to guide implementation:

| Day | Type | App name | Summary | Domain |
|---|---|---|---|---|
| 1 (WE) | submission‑triage‑copilot | Upload broker submission docs → extract key fields; score against risk appetite; recommend accept/refer/decline with reasoning | Underwriting |
| 2 (WE) | portfolio‑mix‑dashboard | Upload portfolio CSV → analyse class/territory/limit distribution; produce dashboard and commentary | Underwriting |
| … | … | … | … | … |

(…and so on for all 30 apps.)

## How to Use This Prompt

When you (the agent) receive a **Linear issue** directing you to implement a part of this project:
1. Read the relevant section of this prompt and the issue description.
2. Navigate the repository (code, docs) to gather context; do not rely on external memory.
3. Write tests first (`tests/`) to cover the acceptance criteria.
4. Implement the feature in the appropriate `apps/<app>` folder, using shared utilities.
5. Ensure all new code passes linting, type checking and tests.
6. Update documentation.
7. Commit your changes with a concise message referencing the Linear issue key and open a pull request.

By following this master prompt, you will produce a cohesive, professional portfolio of AI applications that demonstrate your ability to build at the intersection of insurance and AI.

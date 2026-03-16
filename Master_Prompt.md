# Master Prompt - 30-Day Insurance AI Challenge

## Purpose

This master prompt is intended for use with **Codex** or other agentic coding assistants. It describes the overall goals, architecture, conventions, and constraints for the 30-day challenge to build 30 small AI-powered applications for the London Market, including Lloyd's and specialty insurance. Agents should refer back to this document whenever creating new files, writing code, tests, or documentation.

## Challenge Overview

You are tasked with creating **30 distinct, demo-ready applications** that solve real problems in underwriting, exposure management, claims operations, broking, productivity, leadership, and general insurance utilities. Each application should be demoable end-to-end in **2-3 minutes**, deployed on the free tier of **Vercel**, and leverage a **shared Supabase** project for persistence. All work should adhere to **test-driven development**, **structured logging**, **observability**, and **harness-engineering** best practices.

## Repository Structure

Create a monorepo under the root folder, named `ai-ops-for-insurance` unless there is a deliberate reason to choose another name. The intended top-level structure is:

```text
ai-ops-for-insurance/
├── apps/                 # One subfolder per application
│   ├── submission-triage-copilot/
│   ├── portfolio-mix-dashboard/
│   └── ...               # 28 more
├── packages/
│   ├── lib/              # Shared utilities: logging, Supabase client, AI helpers
│   ├── common-ui/        # Reusable React components
│   └── config/           # Centralized configuration helpers
├── docs/                 # Design docs and roadmap artifacts
├── WORKFLOW.md
├── Master_Prompt.md
└── README.md
```

## Repository Expectations

### `apps/`

Each folder under `apps/` should be a stand-alone **Next.js latest stable** application using TypeScript, Tailwind CSS, and the Next.js App Router. As of **March 15, 2026**, the baseline stack is **Next.js 16.1.6**, **React 19.2.4**, **TypeScript 5.9.3**, and **Tailwind CSS 4.2.1**. Include:

- A `db/` directory with an idempotent SQL script named `init_<appname>.sql`.
- `src/app/page.tsx` for the main page.
- API routes under `src/app/api/<shortappname>/`.
- Tests under `tests/`.
- A small app-specific README covering purpose, architecture, and run instructions.

### `packages/lib/`

Export shared utilities such as:

- `logging.ts`: A structured logger wrapper that accepts an `appKey` and metadata and emits JSON-serializable logs.
- `supabaseClient.ts`: A factory for creating a Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Use this in API routes only.
- `ai.ts`: Helper functions for calling OpenAI or Anthropic models, exposing a `callLLM({ model, messages, functions })` interface.
- `test-utils.ts`: Shared test helpers for mocking Supabase clients and AI calls.

### `packages/common-ui/`

Include generic components such as `Table`, `Card`, `Modal`, and `Chart`. Style them with Tailwind and keep them flexible through props.

### `packages/config/`

Centralize configuration such as environment variable access and constants, for example `SHARED_SCHEMA_PREFIX = 'app_'`.

## Naming Conventions

1. **Schemas**: Each app uses its own Supabase schema named `app_<shortname>`, such as `app_submissiontriage`.
2. **Tables**: Prefix tables with the app key, for example `app_submissiontriage_core` and `app_submissiontriage_audit`.
3. **API routes**: Use `/api/<shortname>/<endpoint>`. Log the start and end of each request, including important decisions and errors.
4. **Environment variables**: Shared variables such as `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should be stored in local `.env.local` files or managed secret stores, never committed. Per-app secrets should use names such as `APP_<SHORTNAME>_OPENAI_KEY`.
5. **Logging**: Always include `appKey` and `requestId` in log messages. Do not log sensitive data.

## Process and Harness Engineering

Follow harness-engineering principles to maximize agent legibility:

1. **Repository as knowledge base**: Store design docs, schemas, business rules, and examples in `docs/` or Markdown files inside the app folder.
2. **Layered architecture**: Separate types, configuration, repositories, services, runtime, and UI concerns.
3. **Structured logging and invariants**: Use the shared logger, validate inputs, and write tests for critical paths before implementation.
4. **Short-lived PRs**: Keep pull requests focused on a single issue so they are easier to review and merge.
5. **Documentation**: Each app should include a README that explains the problem solved, architecture, run and deploy instructions, and value to the London market. Update `ARCHITECTURE_OVERVIEW.md` whenever shared abstractions evolve.

## AI Models and Cost Management

Use the OpenAI API for language tasks and Codex models for code when appropriate. Implement model routing in `packages/lib/ai.ts` based on task complexity and cost:

- **Cheap models**: `gpt-5-nano`, `gpt-5-mini`, `gpt-4.1-mini` for summarization, simple extraction, and basic classification.
- **Mid-range models**: `gpt-5.1`, `gpt-5.2`, `gpt-5.1-codex` for moderate reasoning and code generation.
- **High-capacity models**: `gpt-5.3-codex`, `gpt-5.4`, `gpt-5.4-codex` for complex document analysis, long-context reasoning, and harder code generation.

Within each API route, allow an override via an environment variable such as `APP_<SHORTNAME>_MODEL`, falling back to the default tier. Cache responses where appropriate to reduce cost.

## Linear and Symphony Integration

- Represent each application as a Linear epic.
- Under each epic, create issues for planning, UI implementation, API implementation, testing, logging and observability, deployment, and documentation.
- Write clear acceptance criteria in each issue, including endpoints, inputs, outputs, success criteria, and test cases.
- When an issue moves to `In Progress`, Symphony can spawn a coding agent that uses this prompt, the repo, and issue context to guide implementation.

## App Schedule and Summaries

The applications should be implemented in the following order. Weekends are marked `WE` and weekdays are marked `WD`.

| Day | Type | App Name                  | Summary                                                                                                                                 | Domain       |
| --- | ---- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | WE   | submission-triage-copilot | Upload broker submission docs, extract key fields, score against risk appetite, and recommend accept, refer, or decline with reasoning. | Underwriting |
| 2   | WE   | portfolio-mix-dashboard   | Upload portfolio CSV data, analyze class, territory, and limit distribution, then produce dashboard commentary.                         | Underwriting |
| ... | ...  | ...                       | ...                                                                                                                                     | ...          |

Extend this schedule with the remaining 28 applications from the roadmap.

## How to Use This Prompt

When an agent receives a Linear issue directing work on this project:

1. Read the relevant section of this prompt and the issue description.
2. Navigate the repository to gather context rather than relying on off-repo memory.
3. Write tests first to cover the acceptance criteria.
4. Implement the feature in the correct `apps/<app>` folder using shared utilities.
5. Ensure all new code passes linting, type checking, and tests.
6. Update documentation.
7. Commit changes with a concise message referencing the Linear issue key and open a pull request.

By following this master prompt, agents should produce a cohesive, professional portfolio of AI applications that demonstrates strong execution at the intersection of insurance and AI.

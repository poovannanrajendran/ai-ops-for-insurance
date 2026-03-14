Architecture Overview

This document provides a high‑level overview of the architecture for the Insurance AI 30 monorepo.  It summarises how the applications are structured, how shared code is organised, and the guiding principles that underpin the design.

1. Monorepo with workspaces

All 30 applications are housed in a single repository, organised into separate directories under apps/.  Shared code lives under packages/.  The repository uses npm/pnpm workspaces to manage dependencies and simplify local development:
	•	apps/<app>: Contains a stand‑alone Next.js 14 application for a specific use case.  Each app has its own package.json, src/app/, API routes (src/app/api/<shortname>), tests (tests/) and db/ with an idempotent init script.
	•	packages/lib: Contains shared utilities: logging wrappers, Supabase client factory, AI helper functions and test utilities.
	•	packages/common-ui: Shared React components (e.g. tables, cards, charts) styled with Tailwind.  These components are generic and can be composed into more complex UI elements within each app.
	•	packages/config: Centralised configuration utilities and constants (e.g. reading env variables, defining common prefixes).

Apps depend on packages via workspace aliases (e.g. import { callLLM } from '@packages/lib/ai').  This encourages reuse and prevents code duplication.

2. Shared Supabase & naming conventions

All apps connect to a single Supabase project.  To prevent collisions and ensure logical separation:
	•	Each app uses its own schema named app_<shortname> (e.g. app_submissiontriage).
	•	Tables within that schema are prefixed with the app key (app_submissiontriage_core, app_submissiontriage_audit, etc.).  Idempotent SQL scripts (db/init_<shortname>.sql) use CREATE SCHEMA IF NOT EXISTS and CREATE TABLE IF NOT EXISTS to set up the schema and tables on first run.
	•	API routes live under /api/<shortname>/... and should only access their own schema via the Supabase client.
	•	Logging messages include the appKey so logs can be filtered per app.

3. Layered architecture within each app

To keep code maintainable and legible for agents and humans, each app follows a layered structure:
	•	Types (types/): Define TypeScript interfaces and schemas for database records, API payloads and domain entities.
	•	Repositories (repositories/): Encapsulate data access.  Functions here call Supabase and return typed results.  They should not contain business logic.
	•	Services (services/): Contain business logic and orchestrate calls to repositories and AI models via the helper in packages/lib/ai.ts.
	•	API routes (src/app/api/<shortname>): Handle HTTP requests, perform input validation (e.g. using Zod), call services, log the request lifecycle and return responses.
	•	UI components (src/app/): Next.js page files and React components compose the user interface.  They should be declarative and lean on the service layer for data.

This structure enforces separation of concerns and makes it easier for agents to determine where to implement changes ￼.

4. Logging and observability

Structured logging is implemented via packages/lib/logging.ts.  API routes should call logger.info() or logger.error() with a message and metadata (including appKey and requestId).  This ensures logs are machine‑readable and can be routed to external sinks in the future.  Avoid logging personal or confidential data.

Observability hooks (e.g. timings) can be added around key service calls.  These provide insights into performance and help detect anomalies.

5. AI helper and model routing

The packages/lib/ai.ts file encapsulates calls to LLMs.  It exposes a callLLM function that accepts:
	•	model: model name (e.g. gpt‑5‑nano, gpt‑5.1, gpt‑5.3‑codex)
	•	messages: an array of chat messages for conversation prompts
	•	functions (optional): structured function definitions for function‑calling models

The helper determines which OpenAI API endpoint to call and returns the assistant’s response.  A model routing mechanism selects a cheaper model for simple tasks (classification, summarisation) and a higher‑capacity model when complex reasoning or long context is needed ￼.  This keeps costs manageable without sacrificing quality.

6. Test harness

Unit and integration tests are critical to ensure confidence in agent‑generated code.  Each app includes a tests/ folder.  Shared test utilities live in packages/lib/test-utils.ts and provide functions to mock Supabase, stub OpenAI responses and assert logging.  Tests should cover:
	•	Happy paths (valid inputs produce expected outputs).
	•	Error cases (invalid inputs return proper status codes and error messages).
	•	Logging behaviour (logs contain the right keys and metadata).

Running pnpm test in the root executes all tests across the monorepo.  CI (GitHub Actions) runs tests on every pull request.

7. Extensibility & future work

This architecture is intentionally modular.  Adding a new application involves creating a new folder under apps/, defining its schema in db/init_<shortname>.sql, adding its API routes and UI, and importing shared utilities.  Logging and TDD practices ensure the new app integrates smoothly.  Harness engineering practices—storing all context in the repo, enforcing boundaries, writing clean code—make it easier for future agents (via OpenAI Symphony or other frameworks) to autonomously build upon this foundation.

Future enhancements might include:
	•	Integrating a real observability platform (e.g. OpenTelemetry or Datadog) by replacing the simple logger.
	•	Adding caching to the AI helper to reduce repeated calls for identical prompts.
	•	Implementing a CodeQL or SonarCloud step for security and quality scanning.
	•	Writing custom ESLint rules to enforce the layered architecture automatically.

By adhering to this architecture, the challenge delivers a cohesive, maintainable set of applications that demonstrate the power of AI in the London insurance market.
# Architecture Overview

This document provides a high-level overview of the architecture for the Insurance AI 30 monorepo. It summarizes how the applications are structured, how shared code is organized, and the principles that underpin the design.

## 1. Monorepo with Workspaces

All 30 applications live in a single repository, organized into separate directories under `apps/`. Shared code lives under `packages/`. The repository uses npm or pnpm workspaces to manage dependencies and simplify local development.

- `apps/<app>`: A stand-alone Next.js latest stable application for a specific use case. As of March 15, 2026, use the baseline stack of Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3, and Tailwind CSS 4.2.1. Each app has its own `package.json`, `src/app/`, API routes under `src/app/api/<shortname>`, tests under `tests/`, and `db/` with an idempotent init script.
- `packages/lib`: Shared utilities such as logging wrappers, the Supabase client factory, AI helper functions, and test utilities.
- `packages/common-ui`: Shared React components such as tables, cards, and charts, styled with Tailwind and designed for reuse.
- `packages/config`: Centralized configuration utilities and constants such as environment helpers and naming prefixes.

Workspace aliases should be used to encourage reuse and reduce duplication.

## 2. Shared Supabase and Naming Conventions

All apps connect to a single Supabase project. To prevent collisions and preserve separation:

- Each app uses its own schema named `app_<shortname>`, for example `app_submissiontriage`.
- Tables within that schema are prefixed with the app key, such as `app_submissiontriage_core` and `app_submissiontriage_audit`.
- Idempotent SQL scripts such as `db/init_<shortname>.sql` should use `CREATE SCHEMA IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`.
- API routes live under `/api/<shortname>/...` and should only access their own schema via the Supabase client.
- Logging messages should include the `appKey` so logs can be filtered per app.

## 3. Layered Architecture Within Each App

To keep code maintainable and legible for both humans and agents, each app should follow a layered structure:

- `types/`: TypeScript interfaces and schemas for database records, API payloads, and domain entities.
- `repositories/`: Data access logic. These functions call Supabase and return typed results without business logic.
- `services/`: Business logic that orchestrates repositories and AI model calls.
- `src/app/api/<shortname>`: HTTP handlers that validate input, call services, log the request lifecycle, and return responses.
- `src/app/`: Next.js pages and React components for the user interface.

This structure enforces separation of concerns and makes it easier to determine where changes belong.

## 4. Logging and Observability

Structured logging should be implemented via `packages/lib/logging.ts`. API routes should call logger methods with a message and metadata that includes `appKey` and `requestId`. Logs should be machine-readable and should not include personal or confidential data.

Observability hooks such as timing measurements can be added around key service calls. These provide insight into performance and make anomalies easier to detect.

## 5. AI Helper and Model Routing

The `packages/lib/ai.ts` file should encapsulate calls to language models. It can expose a `callLLM` function that accepts:

- `model`: The model name, such as `gpt-5-nano`, `gpt-5.1`, or `gpt-5.3-codex`.
- `messages`: An array of chat messages.
- `functions` or similar structured tool definitions when needed.

The helper should choose a cheaper model for simple tasks such as classification and summarization, and a higher-capacity model when deeper reasoning or longer context is required.

## 6. Test Harness

Unit and integration tests are critical for confidence in agent-generated code. Each app should include a `tests/` folder, and shared test utilities should live in `packages/lib/test-utils.ts`.

Tests should cover:

- Happy paths where valid inputs produce expected outputs.
- Error cases where invalid inputs return proper status codes and messages.
- Logging behavior so logs contain the expected keys and metadata.

Running `pnpm test` from the repo root should execute tests across the monorepo. CI can run the same suite on every pull request.

## 7. Extensibility and Future Work

This architecture is intentionally modular. Adding a new app should involve creating a folder under `apps/`, defining its schema in `db/init_<shortname>.sql`, adding API routes and UI, and reusing shared utilities.

Possible future enhancements include:

- Replacing the simple logger with a full observability platform such as OpenTelemetry or Datadog.
- Adding caching to the AI helper to reduce repeated calls for identical prompts.
- Integrating quality and security analysis tools such as CodeQL or SonarCloud.
- Writing custom ESLint rules to enforce architectural boundaries automatically.

By adhering to this architecture, the challenge can deliver a cohesive, maintainable set of applications that demonstrate the practical use of AI in the London insurance market.

# Development and Deployment Workflow

This document describes how to work within the **AI-Ops-for-Insurance** monorepo. It covers the end-to-end process from initial setup through local development, testing, deployment, and collaboration with Symphony and Linear.

## 1. Pre-Development Checklist

Before starting work on any app:

1. **Repository initialization**: Ensure the monorepo exists under `/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance` and has been pushed to GitHub. The repo should include `WORKFLOW.md`, `Master_Prompt.md`, and the `docs/` directory. Do not add a `vercel.json` file unless required; Vercel's defaults are usually sufficient for Next.js.
2. **Supabase project**: Confirm that a single Supabase project has been created for the entire challenge. Copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env` at the repository root. Do not commit secrets to GitHub.
3. **Environment variables**: For each app, determine which third-party API keys are required, such as OpenAI keys. Store them in Vercel project settings using the prefix `APP_<SHORTNAME>_...`. For local testing, use `.env.local` or terminal environment variables.
4. **Linear board**: If using Linear and Symphony, create a project or team for the challenge. Add an epic for each app with an overview description. Within each epic, create issues for design and requirements, API implementation, UI implementation, testing, logging and observability, deployment, and documentation. Include acceptance criteria and test scenarios.
5. **Third-party APIs**: Before coding, review the documentation for any external APIs, such as OpenAI or Lloyd's feeds, and experiment with simple calls. Confirm quota limits and required scopes before implementation.

Automation tip: Rather than creating the Linear board manually, you can automate the process by calling Linear's GraphQL API via a Node script. Use your Linear API key and a script like the example in the next section to create the project, epics, and a standard set of issues in a batch.

## 2. Automated Linear Setup via Codex

If you want to create your Linear project, epics, and issues programmatically, write a small Node script or ask Codex to generate it. The high-level steps are:

1. Generate a Linear API key in your Linear settings.
2. Create a project named `Insurance AI 30 Challenge`, or another name, via a GraphQL mutation.
3. Iterate over the 30 app definitions from the roadmap to create an epic for each.
4. Within each epic, optionally create a standard set of issues for design, API, UI, testing, logging and observability, deployment, and documentation.

Example Node script using `node-fetch`:

```js
const fetch = require("node-fetch");

const apiKey = process.env.LINEAR_API_KEY;
const headers = {
  "Content-Type": "application/json",
  Authorization: apiKey,
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

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query: mutation }),
  });

  const data = await res.json();
  return data.data.projectCreate.project.id;
}

async function createEpic(projectId, name, description) {
  const mutation = `
    mutation ($projectId: String!, $name: String!, $description: String!) {
      issueCreate(input: {
        title: $name,
        description: $description,
        projectId: $projectId,
        teamId: null,
        assigneeId: null,
        priority: 0,
        labels: []
      }) {
        success
        issue { id title }
      }
    }
  `;

  const variables = { projectId, name, description };
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query: mutation, variables }),
  });

  return (await res.json()).data.issueCreate.issue.id;
}

async function main() {
  const projectId = await createProject();
  const apps = [
    {
      name: "submission-triage-copilot",
      description:
        "Upload broker submission docs, extract key fields, and score against risk appetite.",
    },
    // Add other apps here.
  ];

  for (const app of apps) {
    await createEpic(projectId, app.name, app.description);
  }
}

main().catch(console.error);
```

This script demonstrates how to create a project and epics. You can extend it to create issues under each epic by adding more mutations. To speed up creation, you can batch multiple GraphQL mutations into a single request.

## 3. Working on an Issue

1. Read the Linear issue description and the relevant portion of the roadmap. Understand the persona, problem statement, value proposition, and acceptance criteria.
2. Identify affected packages. Determine whether you need to modify shared utilities in `packages/lib`, shared UI components in `packages/common-ui`, or files within a specific app under `apps/`.
3. Write tests first. Create or update test files in the app's `tests/` directory. Use Vitest or Jest, and React Testing Library for frontend components. Mock external dependencies such as Supabase and OpenAI using shared test utilities.
4. Implement code. Follow the layered architecture: types, repositories, services, and handlers or API routes. For UI changes, create components under `src/app` and reuse shared components when appropriate. Use structured logging in API routes.
5. Run and fix tests. Run `pnpm test` or `pnpm --filter @apps/<shortname> test` and ensure tests pass before proceeding.
6. Update documentation. Amend the app's README to include any new endpoints, configuration steps, or UI instructions. If shared abstractions change, update `ARCHITECTURE_OVERVIEW.md`.
7. Commit and open a pull request. Use a descriptive commit message referencing the Linear issue ID, then push your branch and open a PR. Ensure the branch passes linting and type checking.
8. Code review. A human reviewer should check correctness, adherence to architecture, and clarity before merge.
9. Deploy to Vercel. Run `vercel --prod` from the app folder or trigger a deploy via the Vercel UI. Set required environment variables before deploying and verify the deployed app.

## 4. Logging and Observability

- **Structured logging**: Use `packages/lib/logging.ts` to log JSON-formatted messages. Each log entry should include `appKey`, `requestId`, `level`, and `message`. Avoid logging sensitive information.
- **Error handling**: Catch errors in API routes and respond with appropriate HTTP status codes. Log errors with stack traces and useful context. Use Zod or similar libraries for input validation.
- **Metrics and KPIs**: For applications that calculate metrics, include instrumentation points so latency and throughput can be measured.
- **Observability roadmap**: Route logging calls through the shared logger so the implementation can later be replaced by a more advanced observability tool.

## 5. Model Selection and Cost Management

In `packages/lib/ai.ts`, implement helper functions to call language models. The helper should accept a `model` parameter and use sensible defaults:

- **Cheap models**: `gpt-5-nano`, `gpt-5-mini`, `gpt-4.1-mini` for simple classification, extraction, and summarization.
- **Mid-range models**: `gpt-5.1`, `gpt-5.2`, `gpt-5.1-codex` for moderate reasoning, multi-step synthesis, or straightforward code generation.
- **High-capacity models**: `gpt-5.3-codex`, `gpt-5.4`, `gpt-5.4-codex` for complex document analysis, diffing, or code generation that requires deep context.

Each app may override the default via `APP_<SHORTNAME>_MODEL`. If a cheaper model fails to meet acceptance criteria, fall back to a higher-capacity model. Cache results where practical to avoid repeated calls.

## 6. Pre-Production Checklist

Before a major deploy, run through this checklist:

1. **Tests passing**: All unit and integration tests pass across the monorepo, with sufficient coverage on critical paths.
2. **Environment variables set**: Supabase credentials and app-specific keys are configured in Vercel. Secrets are not checked into GitHub.
3. **Database migrations executed**: Run the app's `db/init_<shortname>.sql` script via Supabase or an automated bootstrap script. Use idempotent SQL such as `CREATE TABLE IF NOT EXISTS`.
4. **Logging verified**: Check Vercel logs to ensure structured logging is working and sensitive data is not being printed.
5. **Deployment tested**: Walk through the deployed app's main flow and confirm the output matches expectations.

## 7. Harness Engineering Guidance

Harness engineering is the practice of making the repository legible to agents and enforcing architectural discipline. Key points:

1. **Store decisions in the repo**: Keep design documents, schemas, and example inputs and outputs in `docs/` or within each app folder. Avoid undocumented external context.
2. **Layered structure**: Separate data access, business logic, routing, and UI layers. Keep files focused and small.
3. **Custom linting**: Consider ESLint rules to enforce import boundaries and naming conventions. Use Prettier for consistent formatting.
4. **Short PRs**: Encourage small, reviewable pull requests. Small PRs reduce reviewer load and make agent work easier to validate.
5. **Agent legibility**: Use descriptive names, clear comments where needed, and straightforward code organization so future agents can navigate the repo efficiently.

By following this workflow, the repo stays consistent, testable, maintainable, and easy to extend for both humans and AI agents.

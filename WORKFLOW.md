Development & Deployment Workflow

This document describes how to work within the AI‑Ops‑for‑Insurance monorepo.  It covers the end‑to‑end process from initial setup through local development, testing, deployment and collaboration with Symphony/Linear.

1. Pre‑development checklist

Before starting work on any app:
	1.	Repository initialisation: Ensure the monorepo exists under /Users/poovannanrajendran/Documents/GitHub/ai‑ops‑for‑insurance and has been pushed to GitHub.  The repo should include this WORKFLOW.md, MASTER_PROMPT.md, and the docs/ directory.  Do not add a vercel.json file unless required—Vercel’s defaults suffice for Next.js.
	2.	Supabase project: Confirm that a single Supabase project has been created for the entire challenge.  Copy the NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY into .env at the repository root.  Do not commit secrets to GitHub.
	3.	Environment variables: For each app, determine which third‑party API keys are required (e.g. OpenAI keys).  Store them in Vercel’s project settings using the prefix APP_<SHORTNAME>_….  For local testing, you may define them in .env.local or via the terminal.
	4.	Linear board: If using Linear + Symphony, create a project or team for the challenge.  Add an epic for each app (e.g. “submission‑triage‑copilot”) with an overview description.  Within each epic, create issues for design/requirements, API implementation, UI implementation, testing, logging/observability, deployment and documentation.  Include acceptance criteria and test scenarios.
Automation tip: Rather than creating the board manually, you can automate the process by calling Linear’s GraphQL API via a Node script.  Use your Linear API key and a script like the example in the Automated Linear setup via Codex section below to create the project, epics and a standard set of issues in a batch.  Codex can generate and execute this script to set up the board for you.
	5.	Third‑party APIs: Before coding, review the documentation for any external APIs (e.g. OpenAI, Lloyd’s feeds) and experiment with simple calls.  Confirm quota limits and required scopes.  This avoids surprises during implementation.

Automated Linear setup via Codex

If you would like to create your Linear project, epics and issues programmatically, you can write a small Node script (or ask Codex to generate it) that calls Linear’s GraphQL API.  The high‑level steps are:
	1.	Generate a Linear API key in your Linear settings.
	2.	Create a project named “Insurance AI 30 Challenge” (or another name) via a GraphQL mutation.
	3.	Iterate over the 30 app definitions from the v4 roadmap to create an epic for each.  Include a brief summary in the epic description.
	4.	Within each epic, optionally create a standard set of issues—e.g. design/requirements, API implementation, UI implementation, testing, logging/observability, deployment and documentation—each with acceptance criteria.

Here is an example Node script using node-fetch:
```const fetch = require('node-fetch');

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

main().catch(console.error);```

This script demonstrates how to create a project and epics.  You can extend it to create issues under each epic by adding further mutations.  To speed up creation, you can batch multiple GraphQL mutations in a single request.  Codex can help generate and run this script for you once you provide your Linear API key.

2. Working on an issue
	1.	Read the Linear issue description and the relevant portion of the v4 roadmap.  Understand the persona, problem statement, value proposition and acceptance criteria.
	2.	Identify affected packages: Determine whether you need to modify shared utilities (packages/lib), shared UI components (packages/common‑ui) or create new files within an app’s folder under apps/.
	3.	Write tests first: Create or update test files in the tests/ directory of the app.  Use Vitest or Jest (configured per app) and, for frontend components, React Testing Library.  Mock external dependencies (Supabase, OpenAI) using utilities from packages/lib/test‑utils.ts.  Tests should express the acceptance criteria clearly and fail initially.
	4.	Implement code: After tests are in place, implement the required functionality.  Use the layered architecture: types, repositories, services and handlers (API routes).  For UI changes, create components under src/app and reuse from packages/common‑ui.  Use the structured logger (packages/lib/logging.ts) in API routes: log request start, key decisions and errors; include appKey and requestId in each log entry.
	5.	Run and fix tests: Run tests locally (pnpm test or pnpm --filter @apps/<shortname> test) and ensure they pass.  Fix failing tests before proceeding.  Maintain code coverage to ensure critical paths are tested.
	6.	Update documentation: Amend the app’s README to include any new endpoints, configuration steps or UI instructions.  If shared abstractions change, update docs/ARCHITECTURE_OVERVIEW.md.  Provide examples of input/output JSON where relevant.
	7.	Commit and open a pull request: Use a descriptive commit message referencing the Linear issue ID (e.g. feat(submission‑triage‑copilot): implement file upload and extraction (LT‑123)).  Push your branch and open a PR.  Symphony attaches CI/test results if the code was generated by an agent.  Ensure the branch passes linting (pnpm lint) and type checking (pnpm types).
	8.	Code review: A human (you or a colleague) reviews the PR for correctness, adherence to architecture and clarity.  Suggest improvements as comments.  Once approved, merge the PR.
	9.	Deploy to Vercel: Navigate to the app’s folder and run vercel --prod or trigger a deploy via Vercel UI.  Set required environment variables in the Vercel project before deploying.  Verify the deployment by following the link provided.

3. Logging & observability
	•	Structured logging: Use packages/lib/logging.ts to log JSON‑formatted messages.  Each log entry must include appKey, requestId, level and message.  Avoid logging sensitive information.  Logs will be visible in Vercel’s logging dashboard and can be routed to external sinks later.
	•	Error handling: Catch errors in API routes and respond with appropriate HTTP status codes.  Log errors with stack traces and context.  Use Zod or similar libraries for input validation and return 400 for invalid requests.
	•	Metrics & KPIs: For applications that calculate metrics (e.g. ops health monitor), include instrumentation points (start and end time) so that latency and throughput can be measured.
	•	Observability roadmap: The shared logger is designed to be replaced by a more sophisticated observability tool (e.g., OpenTelemetry).  Ensure all logging calls route through logging.ts so that this swap is easy.

4. Model selection & cost management

In packages/lib/ai.ts, implement helper functions to call language models.  The helper accepts a model parameter and uses sensible defaults:
	•	Cheap models (e.g. gpt‑5‑nano, gpt‑5‑mini, gpt‑4.1‑mini): use for simple classification, extraction and summarisation tasks.  These models cost less per thousand tokens and keep costs low ￼.
	•	Mid‑range models (e.g. gpt‑5.1, gpt‑5.2, gpt‑5.1‑codex): use for tasks requiring moderate reasoning, multi‑step synthesis or straightforward code generation.
	•	High‑capacity models (e.g. gpt‑5.3‑codex, gpt‑5.4, gpt‑5.4‑codex): reserve for complex document analysis, diffing or code generation requiring deep context.

Each app may override the default via an environment variable (APP_<SHORTNAME>_MODEL).  If a cheap model fails to meet acceptance criteria, fall back to a higher‑capacity model.  Cache results where possible to avoid repeated calls.

5. Pre‑production checklist

Before a major deploy (e.g. finalising an app for a demo), run through this checklist:
	1.	Tests passing: All unit and integration tests pass across the monorepo.  Coverage is sufficient on critical paths.
	2.	Env variables set: Supabase URL and service key are configured in Vercel, along with any app‑specific keys.  Secrets are not checked into GitHub.
	3.	Database migrations executed: Run the app’s db/init_<shortname>.sql script via Supabase or via an automated script in the app on first run.  Ensure no existing tables are dropped (use CREATE TABLE IF NOT EXISTS).
	4.	Logging verified: Check Vercel logs to ensure structured logging is working.  No sensitive data is printed.
	5.	Deployment tested: Navigate to the deployed app, run through the main flow, and confirm the output matches expectations.  Provide a 2–3 minute demo script for stakeholders.

6. Harness engineering guidance

Harness engineering is the practice of making your repository legible to agents and enforcing architectural discipline ￼.  Key points:
	1.	Store decisions in the repo: All design documents, data schemas and example inputs/outputs must live in docs/ or within each app’s folder.  Avoid referencing undocumented external context.
	2.	Layered structure: Separate data access, business logic and routing/UI layers.  Keep files small and focused.  Agents perform better when each file has a clear purpose ￼.
	3.	Custom linting: Consider adding ESLint rules to enforce import boundaries (no cross‑layer imports) and naming conventions.  Use Prettier for consistent formatting.
	4.	Short PRs: Encourage small, reviewable pull requests.  Symphony can generate PRs for individual issues; merging small, high‑confidence changes reduces context for reviewers and speeds up iteration.
	5.	Agent legibility: Write code and comments that are easy for future agents to parse.  Avoid obfuscation, keep names descriptive, and provide examples where necessary.

By following this workflow, you will build consistent, high‑quality applications that are easy to test, maintain and extend—both by humans and by AI agents.
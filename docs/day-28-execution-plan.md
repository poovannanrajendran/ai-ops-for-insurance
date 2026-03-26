# Day 28 Execution Plan - Stakeholder Comms Drafter

## Objective
Build a deterministic comms drafting tool that converts structured operational bullets into audience-specific stakeholder updates with governance checks.

## Scope
- Parse key-value comms inputs (`comms_type`, `audience`, `tone`, `subject`, `context`, `message_*`, `action_*`).
- Enforce required-field gate and completeness scoring.
- Generate deterministic draft output and prompt-hit snippets.
- Persist result + audit rows into Supabase schema `app_stakeholdercomms`.

## Acceptance Criteria
- Intake split-pane UI with three samples and query prompt.
- Status dots in header for storage and comms readiness.
- Full-width whitespace wording table with status column.
- API route returns `analysis`, `persistence`, `processingTimeMs`, `requestId`.
- Unit + route tests include positive and negative cases.
- Visual contracts pass with no React duplicate-key warnings.

## Database
- `apps/stakeholder-comms-drafter/db/init_stakeholdercomms.sql`
- Tables: `comms_runs`, `comms_audit`

## Quality Gates
- `pnpm --filter @ai-ops/stakeholder-comms-drafter test`
- `pnpm --filter @ai-ops/stakeholder-comms-drafter lint`
- `pnpm --filter @ai-ops/stakeholder-comms-drafter typecheck`
- `pnpm --filter @ai-ops/stakeholder-comms-drafter build`
- QA contracts + Playwright visual smoke

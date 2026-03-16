# Symphony Execution Playbook

Use this playbook before turning Symphony on for any day in the challenge.

## Core Rules

1. Do not run a whole day as a single executable issue.
2. Keep the day issue as the parent tracker.
3. Create 4 to 7 child issues with one coding objective each.
4. Move only one child issue into `Todo` or `In Progress`.
5. Keep parent issues out of active Symphony states.

## Child Issue Template

Each child issue should include:

- Scope: one concrete deliverable
- In scope: expected files or layers
- Out of scope: adjacent work to avoid
- Verification: exact commands
- Done when: 2 to 4 short acceptance bullets

## Recommended Child Issue Types

- Scaffold: app folder, package metadata, README, SQL bootstrap
- Service logic: parsing, validation, scoring, analysis, persistence
- API and UI: route handlers, forms, tables, charts, commentary
- Tests and docs: unit tests, route tests, README updates, verification
- Sample data: realistic demo inputs, fixtures, edge cases, and seed files
- Tester: execute the stated verification steps, validate critical paths, and record failures clearly
- Reviewer: review the deliverable for design quality, security, performance, and maintainability before marking the parent ready

## Agent Lanes

Treat these as separate agent roles, implemented as separate Linear child issues:

- Builder agent: produces the code for one narrow slice
- Sample data agent: creates realistic input files, demo payloads, and edge-case fixtures
- Tester agent: validates the delivered slice against the stated commands and demo flow
- Reviewer agent: checks design coherence, security, performance, and obvious regressions

Do not combine all four roles into one Symphony issue.

## Watchdog Policy

The repo-level watchdog stops Symphony when one of these conditions is met:

- total runtime token cap exceeds `SYMPHONY_WATCHDOG_HARD_MAX_TOTAL_TOKENS`
- issue token cap exceeds `SYMPHONY_WATCHDOG_HARD_MAX_ISSUE_TOKENS`
- no code files changed after `SYMPHONY_WATCHDOG_NO_CODE_RUNTIME_MS` and token burn exceeds `SYMPHONY_WATCHDOG_NO_CODE_TOKEN_FLOOR`
- more than `SYMPHONY_WATCHDOG_MAX_TURNS_WITHOUT_CODE` turns complete without code changes and the issue is still burning tokens

Default stance in this repo:

- stop fast if a child task has not touched code after roughly the first minute
- prefer restarting with a tighter issue over letting a broad reasoning turn continue

## Day 2 Example

Parent:

- `Day 02 - portfolio-mix-dashboard`

Child tasks:

- scaffold `portfolio-mix-dashboard` app shell and README
- implement CSV parsing and portfolio aggregation service
- add API route and dashboard presentation
- add tests, verification, and SQL bootstrap
- create sample portfolio CSV fixtures and demo inputs
- run tester pass on the finished deliverable
- run reviewer pass for design, security, and performance

## Operator Checklist

1. Confirm `pnpm symphony:doctor` passes.
2. Confirm the parent issue is not in an active state.
3. Confirm only one child issue is in `Todo` or `In Progress`.
4. Start with `pnpm symphony:run`.
5. Watch:
   - `http://127.0.0.1:4310/`
   - `.symphony/runtime.log`
   - `.symphony/watchdog.log`
6. If the watchdog stops the run, inspect `.symphony/watchdog-last-stop.json`, tighten the child issue, and retry.

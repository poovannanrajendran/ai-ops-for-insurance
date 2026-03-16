# Portfolio Mix Dashboard

Day 2 scaffold app for the 30-day challenge.

## Purpose

Accept a portfolio CSV from underwriting or portfolio management teams, then turn it into a fast view of class, territory, and limit concentration.

`POO-42` only establishes the app shell. Parsing, aggregation, route handling, and commentary are delivered in later Day 2 child issues.

## Current scope

- standalone Next.js app scaffold under `apps/portfolio-mix-dashboard`
- portfolio upload and paste intake flow
- deterministic CSV parsing and portfolio aggregation service
- `/api/portfoliomix/analyze` route with structured logging, commentary, and warning generation
- optional Supabase persistence for stored analysis runs
- unit tests for parsing, validation, and summary generation
- interactive dashboard rendering for class, territory, and limit-band distributions
- app-local README and shared app metadata

## Planned next slices

- realistic sample data fixtures
- tester and reviewer passes

## Local run

```sh
pnpm install
pnpm --filter @ai-ops/portfolio-mix-dashboard dev
```

The app runs on `http://localhost:3002`.

## Verification

```sh
pnpm --filter @ai-ops/portfolio-mix-dashboard test
pnpm --filter @ai-ops/portfolio-mix-dashboard typecheck
pnpm --filter @ai-ops/portfolio-mix-dashboard build
```

## Sample data

- `samples/balanced-portfolio.csv`
- `samples/us-property-concentration.csv`
- `samples/malformed-missing-columns.csv`

These fixtures cover a balanced mix, a warning-heavy mix, and a malformed input case.

## Database bootstrap

Run `db/init_portfoliomix.sql` in Supabase if you want stored analysis runs for the demo.

## Notes

- The service layer already parses CSV text and returns class, territory, and limit-band summaries.
- The UI supports pasted CSV text and local file upload into the same route.

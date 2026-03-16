# RAG Operating Model

## Purpose

Provide persistent, searchable project memory across all repositories while preserving a strict per-project focus mode.

## Standard Workflow

1. Add or update docs (`README`, architecture, lessons learned, handoff, guardrails).
2. Run:
   - `pnpm rag:sync-all -- --purge true`
3. Query:
   - `pnpm rag:query -- --project <project_key> --q "<question>" --k 8`
4. If missing context is discovered, update docs and re-sync.

## Project Manifest

Use [`docs/rag/projects.json`](/Users/poovannanrajendran/Documents/GitHub/ai-ops-for-insurance/docs/rag/projects.json) to register projects for sync.

Per entry:

- `project_key`: stable unique identifier
- `name`: display name
- `root`: absolute path to repo root
- `enabled`: optional toggle

## Recommended Cadence

- Run `rag:sync-all` after each meaningful change set.
- Run `rag:sync-all` before demos, releases, or handoffs.
- Run project-specific sync when only one repo changed:
  - `pnpm rag:sync-all -- --project <project_key>`

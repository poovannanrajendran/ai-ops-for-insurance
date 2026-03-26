# Codex Context Core (Tier 1)

Last updated: 2026-03-25

## Purpose
Use this file as the default, minimal context for Codex sessions. Keep it short and stable.

## Project
- Repo: `ai-ops-for-insurance`
- Goal: deliver 30 deterministic, production-style insurance workflow apps (one per day).
- Current implemented scope: Day 1 to Day 19.

## Non-negotiable rules
- Port `3000` is reserved for OpenWebUI. Never use or stop it.
- Every app must include:
  - required-field gate
  - deterministic analysis path
  - Supabase persistence table(s)
  - Supabase audit table + stage writes
  - visual symmetry and spacing consistency
- Avoid destructive git actions unless explicitly requested.

## Standard quality gates
- Unit/API tests (positive + negative paths)
- Playwright visual checks
- Runtime console/page error checks
- Build + typecheck pass
- DB init + Data API exposure validated

## Resume command
Run:

```sh
pnpm codex:resume
```

Then only open the day/app docs needed for the active task.

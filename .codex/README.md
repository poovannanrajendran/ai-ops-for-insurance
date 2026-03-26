# Repo-local Codex Support

This directory holds repo-local helpers for Codex and Symphony runs.

## Current contents

- `hooks/symphony_after_clone.sh`: post-clone bootstrap for Symphony workspaces
- `../scripts/codex/context-brief.sh`: compact runtime status for token-efficient Codex sessions
- `../scripts/codex/resume.sh`: one-command Codex resume flow (Tier 1 context + live brief)
- `../scripts/install-symphony.sh`: installs or refreshes the upstream Symphony runtime locally
- `../scripts/load-local-env.sh`: loads optional repo-local env files for Symphony and Codex helpers
- `../scripts/symphony-doctor.sh`: validates the local Symphony prerequisites for this repo
- `../scripts/symphony-run.sh`: launches the installed runtime against this repo's `WORKFLOW.md`

## Intent

Keep repo-owned automation close to the codebase so agent behavior is reproducible across local runs and Symphony-managed workspaces.

## Codex token-efficiency model

- Tier 1 (always read): `docs/codex/context-core.md`
- Tier 2 (task-relevant): `docs/codex/context-index.md` and only linked files needed for the task
- Tier 3 (reference): full historical docs, loaded only when blocked

Commands:

- `pnpm codex:brief`
- `pnpm codex:resume`

# Repo-local Codex Support

This directory holds repo-local helpers for Codex and Symphony runs.

## Current contents

- `hooks/symphony_after_clone.sh`: post-clone bootstrap for Symphony workspaces
- `../scripts/install-symphony.sh`: installs or refreshes the upstream Symphony runtime locally
- `../scripts/load-local-env.sh`: loads optional repo-local env files for Symphony and Codex helpers
- `../scripts/symphony-doctor.sh`: validates the local Symphony prerequisites for this repo
- `../scripts/symphony-run.sh`: launches the installed runtime against this repo's `WORKFLOW.md`

## Intent

Keep repo-owned automation close to the codebase so agent behavior is reproducible across local runs and Symphony-managed workspaces.

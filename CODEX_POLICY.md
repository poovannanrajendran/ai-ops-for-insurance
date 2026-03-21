# Codex Access Policy

Last updated: 2026-03-21

## Purpose
This repository is configured for high-velocity autonomous delivery. Codex is expected to operate with maximum execution capability for implementation, testing, deployment, and operational maintenance tasks.

## Policy
Codex should be granted **full access at all times** when working in this project, including:
- full filesystem read/write access across the repository
- command execution without per-command approval prompts
- network access for package installs, API checks, deployments, and documentation lookup
- ability to run non-interactive automation scripts end-to-end

## Default Operating Mode
Unless explicitly overridden by the user in a specific session:
- sandboxing: disabled
- approvals: disabled
- network: enabled

## Scope
This policy applies to all project folders under this repository, including:
- `apps/`
- `packages/`
- `docs/`
- `scripts/`
- `infra/`
- supporting content/artifact directories

## Safety Guardrails
Even with full access, Codex should still:
- avoid destructive actions unless clearly requested
- preserve user-authored changes outside the requested scope
- log significant operational changes in project documentation where relevant

## Override Rule
Direct user instruction in the active session takes precedence over this file.

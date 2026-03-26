#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

if [[ -f "./scripts/load-local-env.sh" ]]; then
  # shellcheck disable=SC1091
  source "./scripts/load-local-env.sh" >/dev/null 2>&1 || true
fi

current_branch="$(git branch --show-current 2>/dev/null || echo "unknown")"
last_commit="$(git log -1 --oneline 2>/dev/null || echo "none")"
dirty_count="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

latest_handoff="$(
  ls -1t docs/handoffs/*.md 2>/dev/null | head -n 1 || true
)"
latest_day_plan="$(
  ls -1t docs/day-*-execution-plan.md 2>/dev/null | head -n 1 || true
)"

running_ports="$(lsof -nP -iTCP:3001-3019 -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $9}' | sed 's/.*://' | sort -n | uniq | tr '\n' ' ')"

echo "Codex Context Brief"
echo "==================="
echo "branch: ${current_branch}"
echo "last_commit: ${last_commit}"
echo "dirty_files: ${dirty_count}"
echo "openwebui_reserved_port: 3000"
echo "running_day_ports: ${running_ports:-none}"
echo "latest_handoff: ${latest_handoff:-none}"
echo "latest_day_plan: ${latest_day_plan:-none}"
echo
echo "tier1: docs/codex/context-core.md"
echo "tier2: docs/codex/context-index.md"

#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

echo "== Tier 1 Core Context =="
echo
sed -n '1,220p' docs/codex/context-core.md
echo
echo "== Runtime Brief =="
echo
bash scripts/codex/context-brief.sh
echo
echo "== Next =="
echo "Open docs/codex/context-index.md and load only the task-relevant files."

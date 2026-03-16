#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MISE_BIN="${MISE_BIN:-$(command -v mise || true)}"
SYMPHONY_HOME="${SYMPHONY_HOME:-$HOME/.local/share/openai-symphony}"
SYMPHONY_WORKSPACE_ROOT="${SYMPHONY_WORKSPACE_ROOT:-$HOME/Documents/GitHub/symphony-workspaces/ai-ops-for-insurance}"

# Load optional local env files so repo-local secrets can drive the runtime.
# shellcheck disable=SC1091
. "$REPO_ROOT/scripts/load-local-env.sh"

status_ok() {
  printf '[ok] %s\n' "$1"
}

status_warn() {
  printf '[warn] %s\n' "$1"
}

status_fail() {
  printf '[fail] %s\n' "$1" >&2
}

if [ ! -f "$REPO_ROOT/WORKFLOW.md" ]; then
  status_fail "WORKFLOW.md is missing from the repo root."
  exit 1
fi
status_ok "Found repo workflow at $REPO_ROOT/WORKFLOW.md"

if [ -z "$MISE_BIN" ] || [ ! -x "$MISE_BIN" ]; then
  status_fail "mise is not installed at $MISE_BIN"
  exit 1
fi
status_ok "Found mise at $MISE_BIN"

if [ ! -d "$SYMPHONY_HOME/elixir" ]; then
  status_fail "Symphony runtime is not installed at $SYMPHONY_HOME"
  exit 1
fi
status_ok "Found Symphony runtime at $SYMPHONY_HOME"

if [ ! -x "$SYMPHONY_HOME/elixir/bin/symphony" ]; then
  status_fail "Symphony binary is missing; run scripts/install-symphony.sh"
  exit 1
fi
status_ok "Found built Symphony launcher at $SYMPHONY_HOME/elixir/bin/symphony"

if ! command -v codex >/dev/null 2>&1; then
  status_fail "codex is not on PATH"
  exit 1
fi
status_ok "Found Codex CLI: $(codex --version)"

if [ -z "${LINEAR_API_KEY:-}" ]; then
  status_warn "LINEAR_API_KEY is unset; Symphony cannot boot against Linear yet."
else
  status_ok "LINEAR_API_KEY is set"
fi

mkdir -p "$SYMPHONY_WORKSPACE_ROOT"
status_ok "Workspace root is ready at $SYMPHONY_WORKSPACE_ROOT"

(
  cd "$SYMPHONY_HOME/elixir"
  "$MISE_BIN" exec -- elixir --version >/dev/null
)
status_ok "Elixir toolchain is available through mise"

printf 'Default workspace root: %s\n' "$SYMPHONY_WORKSPACE_ROOT"

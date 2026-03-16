#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MISE_BIN="${MISE_BIN:-$(command -v mise || true)}"
SYMPHONY_HOME="${SYMPHONY_HOME:-$HOME/.local/share/openai-symphony}"
SYMPHONY_WORKSPACE_ROOT="${SYMPHONY_WORKSPACE_ROOT:-$HOME/Documents/GitHub/symphony-workspaces/ai-ops-for-insurance}"
SYMPHONY_PORT="${SYMPHONY_PORT:-4310}"
SYMPHONY_ACK_FLAG="${SYMPHONY_ACK_FLAG:---i-understand-that-this-will-be-running-without-the-usual-guardrails}"
WORKFLOW_PATH="${WORKFLOW_PATH:-$REPO_ROOT/WORKFLOW.md}"
SYMPHONY_WATCHDOG_ENABLED="${SYMPHONY_WATCHDOG_ENABLED:-1}"
RUNTIME_DIR="$REPO_ROOT/.symphony"
SYMPHONY_LOG_PATH="${SYMPHONY_LOG_PATH:-$RUNTIME_DIR/runtime.log}"
WATCHDOG_LOG_PATH="${WATCHDOG_LOG_PATH:-$RUNTIME_DIR/watchdog.log}"
RUNTIME_PID_PATH="$RUNTIME_DIR/runtime.pid"
WATCHDOG_PID_PATH="$RUNTIME_DIR/watchdog.pid"

# Load optional local env files so repo-local secrets can drive the runtime.
# shellcheck disable=SC1091
. "$REPO_ROOT/scripts/load-local-env.sh"

if [ -z "$MISE_BIN" ] || [ ! -x "$MISE_BIN" ]; then
  echo "mise is required at $MISE_BIN" >&2
  exit 1
fi

if [ ! -x "$SYMPHONY_HOME/elixir/bin/symphony" ]; then
  echo "Symphony is not installed at $SYMPHONY_HOME. Run scripts/install-symphony.sh first." >&2
  exit 1
fi

if [ -z "${LINEAR_API_KEY:-}" ]; then
  echo "LINEAR_API_KEY is required before starting Symphony." >&2
  exit 1
fi

if lsof -nP -iTCP:"$SYMPHONY_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $SYMPHONY_PORT is already in use. Stop the existing listener or set SYMPHONY_PORT to another value." >&2
  exit 1
fi

mkdir -p "$SYMPHONY_WORKSPACE_ROOT"
mkdir -p "$RUNTIME_DIR"

export SYMPHONY_WORKSPACE_ROOT

if [ $# -gt 0 ] && [[ "$1" != --* ]]; then
  WORKFLOW_PATH="$1"
  shift
fi

cd "$SYMPHONY_HOME/elixir"
"$MISE_BIN" exec -- ./bin/symphony "$WORKFLOW_PATH" --port "$SYMPHONY_PORT" "$SYMPHONY_ACK_FLAG" "$@" \
  > >(tee -a "$SYMPHONY_LOG_PATH") 2>&1 &
SYMPHONY_PID=$!
echo "$SYMPHONY_PID" >"$RUNTIME_PID_PATH"

cleanup() {
  if [ -f "$WATCHDOG_PID_PATH" ]; then
    WATCHDOG_PID="$(cat "$WATCHDOG_PID_PATH" 2>/dev/null || true)"
    if [ -n "${WATCHDOG_PID:-}" ] && kill -0 "$WATCHDOG_PID" >/dev/null 2>&1; then
      kill "$WATCHDOG_PID" >/dev/null 2>&1 || true
    fi
    rm -f "$WATCHDOG_PID_PATH"
  fi

  rm -f "$RUNTIME_PID_PATH"
}

trap cleanup EXIT INT TERM

if [ "$SYMPHONY_WATCHDOG_ENABLED" = "1" ]; then
  node "$REPO_ROOT/scripts/symphony-watchdog.mjs" --pid "$SYMPHONY_PID" \
    > >(tee -a "$WATCHDOG_LOG_PATH") 2>&1 &
  echo "$!" >"$WATCHDOG_PID_PATH"
fi

wait "$SYMPHONY_PID"

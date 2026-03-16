#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$REPO_ROOT/.symphony"
PID_FILE="$RUNTIME_DIR/runtime.pid"
WATCHDOG_PID_FILE="$RUNTIME_DIR/watchdog.pid"
SYMPHONY_PORT="${SYMPHONY_PORT:-4310}"

stop_pid_file() {
  local pid_file="$1"

  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"

    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      sleep 1

      if kill -0 "$pid" >/dev/null 2>&1; then
        kill -9 "$pid" >/dev/null 2>&1 || true
      fi
    fi

    rm -f "$pid_file"
  fi
}

mkdir -p "$RUNTIME_DIR"

stop_pid_file "$WATCHDOG_PID_FILE"
stop_pid_file "$PID_FILE"

listener_pid="$(lsof -tiTCP:"$SYMPHONY_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$listener_pid" ]; then
  kill "$listener_pid" >/dev/null 2>&1 || true
  sleep 1

  if kill -0 "$listener_pid" >/dev/null 2>&1; then
    kill -9 "$listener_pid" >/dev/null 2>&1 || true
  fi
fi

echo "Symphony stopped."

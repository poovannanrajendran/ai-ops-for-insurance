#!/usr/bin/env bash

set -euo pipefail

MISE_BIN="${MISE_BIN:-$(command -v mise || true)}"
BREW_BIN="${BREW_BIN:-$(command -v brew || true)}"
SYMPHONY_HOME="${SYMPHONY_HOME:-$HOME/.local/share/openai-symphony}"
HEX_HTTP_TIMEOUT="${HEX_HTTP_TIMEOUT:-120}"
HEX_HTTP_CONCURRENCY="${HEX_HTTP_CONCURRENCY:-1}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required to install Symphony." >&2
  exit 1
fi

if [ -z "$MISE_BIN" ] || [ ! -x "$MISE_BIN" ]; then
  if [ -z "$BREW_BIN" ] || [ ! -x "$BREW_BIN" ]; then
    echo "Homebrew is required to install mise automatically." >&2
    exit 1
  fi

  "$BREW_BIN" install mise
  MISE_BIN="$(command -v mise)"
fi

mkdir -p "$(dirname "$SYMPHONY_HOME")"

if [ -d "$SYMPHONY_HOME/.git" ]; then
  git -C "$SYMPHONY_HOME" fetch origin main --depth 1
  git -C "$SYMPHONY_HOME" reset --hard origin/main
else
  git clone --depth 1 https://github.com/openai/symphony "$SYMPHONY_HOME"
fi

cd "$SYMPHONY_HOME/elixir"

"$MISE_BIN" trust
"$MISE_BIN" install
export HEX_HTTP_TIMEOUT HEX_HTTP_CONCURRENCY
"$MISE_BIN" exec -- mix deps.get
"$MISE_BIN" exec -- mix build

cat <<EOF
Symphony runtime is installed at:
  $SYMPHONY_HOME

Next steps:
  1. export LINEAR_API_KEY=...
  2. export SYMPHONY_WORKSPACE_ROOT="\$HOME/Documents/GitHub/symphony-workspaces/ai-ops-for-insurance"
  3. pnpm symphony:doctor
  4. pnpm symphony:run
EOF

#!/usr/bin/env bash
set -euo pipefail

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
fi

corepack pnpm install

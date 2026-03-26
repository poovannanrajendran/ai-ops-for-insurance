#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <app-folder> <package-name> <port>"
  echo "Example: $0 treaty-structure-explainer @ai-ops/treaty-structure-explainer 3012"
  exit 1
fi

APP_FOLDER="$1"
PACKAGE_NAME="$2"
PORT="$3"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

mkdir -p .artifacts/visual-smoke .artifacts/visual-smoke-logs

PID=""
cleanup() {
  if [[ -n "${PID}" ]] && kill -0 "${PID}" >/dev/null 2>&1; then
    kill "${PID}" >/dev/null 2>&1 || true
  fi
  pkill -f "apps/${APP_FOLDER}/.next/dev/build/postcss.js" >/dev/null 2>&1 || true
  pkill -f "apps/${APP_FOLDER}/node_modules/.bin/../next/dist/bin/next dev --webpack --port ${PORT}" >/dev/null 2>&1 || true
  pkill -f "next dev --webpack --port ${PORT}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Proactively clean stale dev workers from prior interrupted runs.
pkill -f "apps/${APP_FOLDER}/.next/dev/build/postcss.js" >/dev/null 2>&1 || true
pkill -f "apps/${APP_FOLDER}/node_modules/.bin/../next/dist/bin/next dev --webpack --port ${PORT}" >/dev/null 2>&1 || true
pkill -f "next dev --webpack --port ${PORT}" >/dev/null 2>&1 || true

# Use webpack mode for QA visual runs to avoid Turbopack worker spikes.
pnpm --filter "${PACKAGE_NAME}" exec next dev --webpack --port "${PORT}" \
  > ".artifacts/visual-smoke-logs/${APP_FOLDER}.log" 2>&1 &
PID="$!"

READY="false"
for _ in $(seq 1 60); do
  if curl -sS "http://localhost:${PORT}" >/dev/null 2>&1; then
    READY="true"
    break
  fi
  sleep 1
done

if [[ "${READY}" != "true" ]]; then
  echo "Server on port ${PORT} did not become ready in time."
  exit 1
fi

TARGET_URL="http://localhost:${PORT}" APP_KEY="${APP_FOLDER}" \
  pnpm exec playwright test tests/playwright/app-visual-smoke.spec.ts

TARGET_URL="http://localhost:${PORT}" APP_KEY="${APP_FOLDER}" \
  pnpm exec playwright test \
    tests/playwright/intake-layout-contract.spec.ts \
    tests/playwright/csv-pane-border-contract.spec.ts \
    tests/playwright/pane-baseline-alignment.spec.ts \
    tests/playwright/react-key-duplicate-guard.spec.ts

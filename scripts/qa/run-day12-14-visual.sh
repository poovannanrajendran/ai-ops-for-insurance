#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

mkdir -p .artifacts/day12-14-visual .artifacts/day12-14-logs

PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
    fi
  done
}
trap cleanup EXIT

pnpm --filter @ai-ops/treaty-structure-explainer dev > .artifacts/day12-14-logs/day12-dev.log 2>&1 &
PIDS+=("$!")
pnpm --filter @ai-ops/exposure-clash-detector dev > .artifacts/day12-14-logs/day13-dev.log 2>&1 &
PIDS+=("$!")
pnpm --filter @ai-ops/claims-leakage-flagger dev > .artifacts/day12-14-logs/day14-dev.log 2>&1 &
PIDS+=("$!")

for port in 3012 3013 3014; do
  ready="false"
  for _ in $(seq 1 60); do
    if curl -sS "http://localhost:${port}" >/dev/null 2>&1; then
      ready="true"
      break
    fi
    sleep 1
  done

  if [[ "${ready}" != "true" ]]; then
    echo "Server on port ${port} did not become ready in time."
    exit 1
  fi
done

pnpm exec playwright test tests/playwright/day12-14-visual.spec.ts


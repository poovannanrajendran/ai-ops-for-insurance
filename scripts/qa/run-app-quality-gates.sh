#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <app-folder> <package-name> <port> [schema] [audit-table]"
  echo "Example: $0 treaty-structure-explainer @ai-ops/treaty-structure-explainer 3012 app_treatystructure app_treatystructure_audit"
  exit 1
fi

APP_FOLDER="$1"
PACKAGE_NAME="$2"
PORT="$3"
SCHEMA="${4:-}"
AUDIT_TABLE="${5:-}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

echo "==> Predeploy sanity checks"
bash ./scripts/predeploy-check.sh "${APP_FOLDER}"

echo "==> Contract tests: positive/negative coverage checks"
node ./scripts/qa/verify-app-tests.mjs "${APP_FOLDER}"

echo "==> Contract checks: sample diversity"
node ./scripts/qa/check-sample-diversity.mjs "${APP_FOLDER}"

echo "==> Contract checks: status-dot semantics"
node ./scripts/qa/check-status-dot-contract.mjs "${APP_FOLDER}"

echo "==> Lint"
pnpm --filter "${PACKAGE_NAME}" lint

echo "==> Test"
pnpm --filter "${PACKAGE_NAME}" test

echo "==> Typecheck"
pnpm --filter "${PACKAGE_NAME}" typecheck

echo "==> Build"
pnpm --filter "${PACKAGE_NAME}" build

echo "==> Playwright visual smoke"
bash ./scripts/qa/run-app-visual.sh "${APP_FOLDER}" "${PACKAGE_NAME}" "${PORT}"

if [[ -n "${SCHEMA}" && -n "${AUDIT_TABLE}" ]]; then
  echo "==> Audit sequence check"
  node ./scripts/qa/check-audit-sequence.mjs "${SCHEMA}" "${AUDIT_TABLE}"
else
  echo "==> Audit sequence check skipped (schema/audit-table not provided)"
fi

echo "✅ All quality gates passed for ${APP_FOLDER}"

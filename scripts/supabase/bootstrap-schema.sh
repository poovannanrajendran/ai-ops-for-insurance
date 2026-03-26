#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <app-slug>"
  echo "Example: $0 treaty-structure-explainer"
  exit 1
fi

APP_SLUG="$1"
APP_DIR="apps/${APP_SLUG}"

if [[ -f "./scripts/load-local-env.sh" ]]; then
  # shellcheck disable=SC1091
  source "./scripts/load-local-env.sh"
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "App directory not found: ${APP_DIR}"
  exit 1
fi

INIT_SQL="$(find "${APP_DIR}/db" -maxdepth 1 -name 'init_*.sql' | head -n 1 || true)"
if [[ -z "${INIT_SQL}" ]]; then
  echo "No init SQL found in ${APP_DIR}/db"
  exit 1
fi

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "SUPABASE_DATABASE_URL is required"
  exit 1
fi

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Data API verification"
  exit 1
fi

SCHEMA_NAME="$(sed -nE 's/^create schema if not exists ([a-zA-Z0-9_]+);/\1/p' "${INIT_SQL}" | head -n 1)"
if [[ -z "${SCHEMA_NAME}" ]]; then
  echo "Could not infer schema name from ${INIT_SQL}"
  exit 1
fi

FIRST_TABLE="$(sed -nE "s/^create table if not exists ${SCHEMA_NAME}\\.([a-zA-Z0-9_]+) \\(.*/\\1/p" "${INIT_SQL}" | head -n 1)"
if [[ -z "${FIRST_TABLE}" ]]; then
  echo "Could not infer first table name from ${INIT_SQL}"
  exit 1
fi

echo "==> Applying init SQL: ${INIT_SQL}"
psql "${SUPABASE_DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${INIT_SQL}" >/dev/null

echo "==> Ensuring Data API schema exposure for role 'authenticator'"
CURRENT_SCHEMAS="$(
  psql "${SUPABASE_DATABASE_URL}" -Atqc "
    set role authenticator;
    select coalesce(current_setting('pgrst.db_schemas', true), '');
    reset role;
  " | tail -n 1
)"
BASE_SCHEMAS="${CURRENT_SCHEMAS:-public,graphql_public}"
MERGED_SCHEMAS="$(
  printf "%s,%s\n" "${BASE_SCHEMAS}" "${SCHEMA_NAME}" \
    | tr ',' '\n' \
    | awk 'NF && !seen[$0]++' \
    | paste -sd ',' -
)"

psql "${SUPABASE_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "alter role authenticator set pgrst.db_schemas = '${MERGED_SCHEMAS}';" >/dev/null
psql "${SUPABASE_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "notify pgrst, 'reload config';" >/dev/null

echo "==> Verifying Data API access for schema '${SCHEMA_NAME}'"
VERIFY_JSON="$(
  curl -sS "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${FIRST_TABLE}?select=*&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Accept-Profile: ${SCHEMA_NAME}"
)"

if echo "${VERIFY_JSON}" | grep -q '"code":"PGRST106"'; then
  echo "Data API verification failed: ${VERIFY_JSON}"
  exit 1
fi

echo "Done."
echo "App: ${APP_SLUG}"
echo "Schema: ${SCHEMA_NAME}"
echo "Data API check: OK"

#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <app-folder-name>"
  echo "Example: $0 claims-fnol-triage-assistant"
  exit 1
fi

APP_NAME="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/$APP_NAME"

if [ ! -d "$APP_DIR" ]; then
  echo "❌ App directory not found: $APP_DIR"
  exit 1
fi

PACKAGE_JSON="$APP_DIR/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
  echo "❌ Missing package.json: $PACKAGE_JSON"
  exit 1
fi

errors=0
warns=0

ok() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; warns=$((warns + 1)); }
fail() { echo "❌ $1"; errors=$((errors + 1)); }

extract_env_value() {
  local key="$1"
  local value=""
  local f
  for f in "$REPO_ROOT/.env.local" "$APP_DIR/.env.local"; do
    if [ -f "$f" ]; then
      local candidate
      candidate="$(awk -F= -v k="$key" '$1==k {sub(/^[^=]*=/, ""); print; exit}' "$f" | sed -E 's/^"(.*)"$/\1/; s/^\x27(.*)\x27$/\1/')"
      if [ -n "$candidate" ]; then
        value="$candidate"
      fi
    fi
  done
  printf "%s" "$value"
}

echo "--- Predeploy check: $APP_NAME ---"

if [ -f "$APP_DIR/vercel.json" ]; then
  ok "vercel.json found"
else
  fail "vercel.json missing"
fi

if rg -q '"next"\s*:' "$PACKAGE_JSON"; then
  ok "Next.js dependency found in package.json"
else
  fail "Next.js dependency missing in package.json"
fi

if rg -q '"build"\s*:' "$PACKAGE_JSON" && rg -q '"lint"\s*:' "$PACKAGE_JSON" && rg -q '"typecheck"\s*:' "$PACKAGE_JSON"; then
  ok "build/lint/typecheck scripts found"
else
  fail "Expected build/lint/typecheck scripts in package.json"
fi

INIT_SQL="$(find "$APP_DIR/db" -maxdepth 1 -name 'init_*.sql' 2>/dev/null | head -n 1 || true)"
SCHEMA=""
ANALYSIS_TABLE=""
AUDIT_TABLE=""

if [ -n "$INIT_SQL" ] && [ -f "$INIT_SQL" ]; then
  SCHEMA="$(sed -nE 's/^create schema if not exists ([a-zA-Z0-9_]+).*/\1/p' "$INIT_SQL" | head -n 1)"
  ANALYSIS_TABLE="$(sed -nE 's/^create table if not exists [a-zA-Z0-9_]+\.([a-zA-Z0-9_]*analysis_runs).*/\1/p' "$INIT_SQL" | head -n 1)"
  AUDIT_TABLE="$(sed -nE 's/^create table if not exists [a-zA-Z0-9_]+\.([a-zA-Z0-9_]*audit).*/\1/p' "$INIT_SQL" | head -n 1)"

  if [ -n "$SCHEMA" ] && [ -n "$ANALYSIS_TABLE" ] && [ -n "$AUDIT_TABLE" ]; then
    ok "DB init contract found: schema=$SCHEMA"
  else
    fail "Could not parse schema/analysis/audit table names from $INIT_SQL"
  fi
else
  fail "Missing db/init_*.sql"
fi

SUPABASE_URL="$(extract_env_value NEXT_PUBLIC_SUPABASE_URL)"
SUPABASE_SERVICE_ROLE_KEY="$(extract_env_value SUPABASE_SERVICE_ROLE_KEY)"

if [ -n "$SUPABASE_URL" ]; then
  ok "NEXT_PUBLIC_SUPABASE_URL found"
else
  fail "NEXT_PUBLIC_SUPABASE_URL missing in .env.local (root or app)"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  ok "SUPABASE_SERVICE_ROLE_KEY found"
else
  fail "SUPABASE_SERVICE_ROLE_KEY missing in .env.local (root or app)"
fi

if command -v vercel >/dev/null 2>&1; then
  inspect_out="$(vercel project inspect "$APP_NAME" --yes 2>/dev/null || true)"
  if [ -n "$inspect_out" ]; then
    root_line="$(printf "%s\n" "$inspect_out" | sed -nE 's/^\s*Root Directory\s*(.*)$/\1/p' | head -n 1 | xargs)"
    expected_root="apps/$APP_NAME"
    if [ -n "$root_line" ]; then
      if [ "$root_line" = "$expected_root" ]; then
        ok "Vercel Root Directory is $expected_root"
      else
        fail "Vercel Root Directory is '$root_line' (expected '$expected_root')"
      fi
    else
      warn "Could not parse Vercel Root Directory from project inspect output"
    fi
  else
    warn "Could not inspect Vercel project '$APP_NAME' (not linked yet or access issue)"
  fi
else
  warn "Vercel CLI not found; skipping project settings checks"
fi

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -n "$SCHEMA" ] && [ -n "$ANALYSIS_TABLE" ] && [ -n "$AUDIT_TABLE" ]; then
  db_check="$(SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" SCHEMA="$SCHEMA" ANALYSIS_TABLE="$ANALYSIS_TABLE" AUDIT_TABLE="$AUDIT_TABLE" node --input-type=module <<'NODE'
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.SCHEMA;
const analysisTable = process.env.ANALYSIS_TABLE;
const auditTable = process.env.AUDIT_TABLE;

async function check(table) {
  const endpoint = `${url}/rest/v1/${table}?select=id&limit=1`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "accept-profile": schema,
      prefer: "count=exact"
    }
  });
  const text = await res.text();
  return {
    table,
    ok: res.ok,
    status: res.status,
    contentRange: res.headers.get("content-range"),
    error: res.ok ? null : text.slice(0, 300)
  };
}

try {
  const a = await check(analysisTable);
  const b = await check(auditTable);
  console.log(JSON.stringify({ analysis: a, audit: b }));
} catch (error) {
  console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
}
NODE
)"

  parsed_db_check="$(DB_CHECK="$db_check" node --input-type=module <<'NODE'
const raw = process.env.DB_CHECK ?? "";
try {
  const payload = JSON.parse(raw);
  if (payload.error) {
    console.log(JSON.stringify({ ok: false, reason: payload.error }));
  } else {
    console.log(
      JSON.stringify({
        ok: Boolean(payload.analysis?.ok) && Boolean(payload.audit?.ok),
        analysisOk: Boolean(payload.analysis?.ok),
        auditOk: Boolean(payload.audit?.ok)
      })
    );
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, reason: error instanceof Error ? error.message : String(error) }));
}
NODE
)"

  db_ok="$(printf "%s" "$parsed_db_check" | rg -o '"ok":(true|false)' | head -n1 | rg -o '(true|false)$')"
  if [ "$db_ok" = "true" ]; then
    ok "Supabase Data API can read analysis and audit tables"
  else
    fail "Supabase table/read check failed: $parsed_db_check"
  fi
fi

echo "--- Summary ---"
echo "Errors: $errors"
echo "Warnings: $warns"

if [ "$errors" -gt 0 ]; then
  exit 1
fi

ok "Predeploy checks passed for $APP_NAME"

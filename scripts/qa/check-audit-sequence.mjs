#!/usr/bin/env node

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const [schema, auditTable] = process.argv.slice(2);
if (!schema || !auditTable) {
  fail("Usage: node scripts/qa/check-audit-sequence.mjs <schema> <audit-table>");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const url = `${supabaseUrl}/rest/v1/${auditTable}?select=request_id,stage,created_at&order=created_at.desc&limit=200`;
const response = await fetch(url, {
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Accept-Profile": schema
  }
});

if (!response.ok) {
  const text = await response.text();
  fail(`Failed to fetch audit data: ${response.status} ${text}`);
}

const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.log("ℹ️  No audit rows found; skipping sequence validation.");
  process.exit(0);
}

const byRequest = new Map();
for (const row of rows) {
  const requestId = row.request_id ?? "unknown";
  const bucket = byRequest.get(requestId) ?? [];
  bucket.push(row.stage);
  byRequest.set(requestId, bucket);
}

const validTerminal = new Set([
  "analysis_completed",
  "validation_failed",
  "analysis_failed"
]);

for (const [requestId, stages] of byRequest.entries()) {
  const reversed = [...stages].reverse(); // oldest -> newest
  if (reversed[0] !== "request_received") {
    fail(`Request ${requestId} does not start with request_received (got: ${reversed[0]}).`);
  }
  const terminal = reversed[reversed.length - 1];
  if (!validTerminal.has(terminal)) {
    fail(`Request ${requestId} terminal stage invalid (got: ${terminal}).`);
  }
}

console.log(`✅ Audit stage sequence check passed for ${schema}.${auditTable} (${byRequest.size} requests).`);

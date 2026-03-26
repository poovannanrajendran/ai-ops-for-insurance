#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const [appFolder] = process.argv.slice(2);
if (!appFolder) {
  fail("Usage: node scripts/qa/check-status-dot-contract.mjs <app-folder>");
}

const repoRoot = process.cwd();
const pagePath = path.join(repoRoot, "apps", appFolder, "src", "app", "page.tsx");
if (!fs.existsSync(pagePath)) {
  fail(`Missing page component: ${pagePath}`);
}

const text = fs.readFileSync(pagePath, "utf8");
const hasGreen =
  /emerald|green/.test(text) && /no issue|synced|stored|passed|healthy|ready/i.test(text);
const hasAmber = /amber|yellow|warning|attention/i.test(text);
const hasRed = /red|issue|failed|error/i.test(text);

if (!hasGreen || !hasAmber || !hasRed) {
  fail(
    "Status-dot semantic contract not met. Expect green/no-issue, amber/warning, and red/issue cues in page component."
  );
}

if (/purple|violet|fuchsia/i.test(text)) {
  fail("Disallowed status colour family found (purple/violet/fuchsia).");
}

console.log(`✅ Status-dot semantic contract passed for ${appFolder}.`);

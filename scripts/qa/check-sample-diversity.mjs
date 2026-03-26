#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const [appFolder] = process.argv.slice(2);
if (!appFolder) {
  fail("Usage: node scripts/qa/check-sample-diversity.mjs <app-folder>");
}

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "apps", appFolder);
const allowlistPath = path.join(appRoot, "tests", "sample-allowlist.json");

let allowlist = { allowIdenticalSampleSignatures: false };
if (fs.existsSync(allowlistPath)) {
  allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
}

const candidates = [
  path.join(appRoot, "src", "lib", "demo-samples.ts"),
  path.join(appRoot, "src", "lib", "submission-samples.ts")
];
const sampleFile = candidates.find((filePath) => fs.existsSync(filePath));
if (!sampleFile) {
  console.log(`ℹ️  No demo sample file found for ${appFolder}, skipping diversity check.`);
  process.exit(0);
}

const text = fs.readFileSync(sampleFile, "utf8");
const signatureMatches = [
  ...text.matchAll(/(?:id|label|title|name)\s*:\s*["'`](.+?)["'`]/g)
].map((match) => match[1].trim().toLowerCase());

if (signatureMatches.length < 3) {
  fail(
    `Expected at least 3 labelled sample signatures in ${path.relative(repoRoot, sampleFile)}; found ${signatureMatches.length}.`
  );
}

const unique = new Set(signatureMatches);
if (unique.size <= 1 && !allowlist.allowIdenticalSampleSignatures) {
  fail(
    `All sample signatures are identical in ${path.relative(
      repoRoot,
      sampleFile
    )}. Add sample variety or set tests/sample-allowlist.json -> allowIdenticalSampleSignatures=true with justification.`
  );
}

console.log(
  `✅ Sample diversity check passed for ${appFolder} (${unique.size}/${signatureMatches.length} unique labels).`
);

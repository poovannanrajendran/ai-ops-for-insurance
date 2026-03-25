#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const [appFolder] = process.argv.slice(2);

if (!appFolder) {
  fail("Usage: node scripts/qa/verify-app-tests.mjs <app-folder>");
}

const repoRoot = process.cwd();
const testsDir = path.join(repoRoot, "apps", appFolder, "tests");

if (!fs.existsSync(testsDir)) {
  fail(`Missing tests directory: ${testsDir}`);
}

const testFiles = fs
  .readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.ts"))
  .map((name) => path.join(testsDir, name));

if (testFiles.length < 2) {
  fail(`Expected at least 2 test files in ${testsDir}. Found ${testFiles.length}.`);
}

const routeTest = testFiles.find((filePath) => path.basename(filePath).includes("route"));
if (!routeTest) {
  fail("Missing route test file (expected filename containing 'route').");
}

const routeText = fs.readFileSync(routeTest, "utf8");
const hasPositiveRoute = /toBe\(200\)|status:\s*200/.test(routeText);
const hasNegativeRoute = /toBe\(400\)|status:\s*400/.test(routeText);

if (!hasPositiveRoute || !hasNegativeRoute) {
  fail(
    "Route tests must include both positive and negative assertions (200 and 400 paths)."
  );
}

const nonRouteTests = testFiles.filter((filePath) => filePath !== routeTest);
const combinedNonRouteText = nonRouteTests
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

const hasPositiveUnit = /expect\(.+\)\.to(Be|Equal|Contain|Match|StrictEqual)/s.test(
  combinedNonRouteText
);
const hasNegativeUnit = /toThrow|throws|missing|required|invalid/i.test(combinedNonRouteText);

if (!hasPositiveUnit || !hasNegativeUnit) {
  fail(
    "Unit/service tests must include both positive and negative paths (e.g., valid + missing/invalid)."
  );
}

console.log(`✅ Test pattern checks passed for ${appFolder}`);

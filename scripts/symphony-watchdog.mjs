#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function readBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];

  if (value == null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function readNumberEnv(name, defaultValue) {
  const raw = process.env[name];

  if (!raw) {
    return defaultValue;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message, meta = undefined) {
  const prefix = `[watchdog] ${new Date().toISOString()} ${message}`;

  if (meta) {
    console.log(`${prefix} ${JSON.stringify(meta)}`);
    return;
  }

  console.log(prefix);
}

async function fetchJson(url, stateFile) {
  if (stateFile) {
    return JSON.parse(await fs.promises.readFile(stateFile, "utf8"));
  }

  const response = await fetch(url, { headers: { accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Unexpected ${response.status} from ${url}`);
  }

  return response.json();
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function candidateRoots(workspacePath) {
  return [
    "apps",
    "packages",
    "docs",
    "README.md",
    "WORKFLOW.md",
    "Master_Prompt.md",
    "ARCHITECTURE_OVERVIEW.md",
  ].map((entry) => path.join(workspacePath, entry));
}

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".pnpm-store",
  "node_modules",
  "coverage",
  "dist",
  "build",
]);

const trackedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".md",
  ".yml",
  ".yaml",
  ".css",
]);

function countChangedFiles(workspacePath, baselineMs) {
  if (!workspacePath || !fs.existsSync(workspacePath)) {
    return 0;
  }

  let changed = 0;
  const stack = candidateRoots(workspacePath).filter((entry) => fs.existsSync(entry));

  while (stack.length > 0) {
    const current = stack.pop();
    let stats;

    try {
      stats = fs.statSync(current);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      for (const child of fs.readdirSync(current)) {
        if (ignoredDirectories.has(child)) {
          continue;
        }

        stack.push(path.join(current, child));
      }

      continue;
    }

    if (!trackedExtensions.has(path.extname(current))) {
      continue;
    }

    if (stats.mtimeMs > baselineMs) {
      changed += 1;
    }
  }

  return changed;
}

async function stopRuntime(pid, reason, dryRun, stopFilePath) {
  const payload = {
    stoppedAt: new Date().toISOString(),
    pid,
    reason,
  };

  if (stopFilePath) {
    await fs.promises.mkdir(path.dirname(stopFilePath), { recursive: true });
    await fs.promises.writeFile(stopFilePath, JSON.stringify(payload, null, 2));
  }

  if (dryRun) {
    log("dry run stop triggered", payload);
    return;
  }

  if (!isProcessAlive(pid)) {
    log("runtime already exited before stop", payload);
    return;
  }

  log("stopping Symphony runtime", payload);
  process.kill(pid, "SIGTERM");
  await sleep(4000);

  if (isProcessAlive(pid)) {
    process.kill(pid, "SIGKILL");
  }
}

const pid = Number(readArg("--pid") || process.env.SYMPHONY_PID || 0);
const port = readNumberEnv("SYMPHONY_PORT", 4310);
const intervalMs = readNumberEnv("SYMPHONY_WATCHDOG_INTERVAL_MS", 15000);
const hardMaxTotalTokens = readNumberEnv("SYMPHONY_WATCHDOG_HARD_MAX_TOTAL_TOKENS", 400000);
const hardMaxIssueTokens = readNumberEnv("SYMPHONY_WATCHDOG_HARD_MAX_ISSUE_TOKENS", 250000);
const noCodeRuntimeMs = readNumberEnv("SYMPHONY_WATCHDOG_NO_CODE_RUNTIME_MS", 60000);
const noCodeTokenFloor = readNumberEnv("SYMPHONY_WATCHDOG_NO_CODE_TOKEN_FLOOR", 80000);
const lowOutputFloor = readNumberEnv("SYMPHONY_WATCHDOG_LOW_OUTPUT_TOKEN_FLOOR", 80000);
const lowOutputRatio = readNumberEnv("SYMPHONY_WATCHDOG_LOW_OUTPUT_RATIO", 0.02);
const maxTurnsWithoutCode = readNumberEnv("SYMPHONY_WATCHDOG_MAX_TURNS_WITHOUT_CODE", 1);
const stateUrl = process.env.SYMPHONY_WATCHDOG_STATE_URL || `http://127.0.0.1:${port}/api/v1/state`;
const stateFile = process.env.SYMPHONY_WATCHDOG_STATE_FILE;
const stopFilePath =
  process.env.SYMPHONY_WATCHDOG_STOP_FILE ||
  path.join(process.cwd(), ".symphony", "watchdog-last-stop.json");
const dryRun = readBooleanEnv("SYMPHONY_WATCHDOG_DRY_RUN", false);
const once = readBooleanEnv("SYMPHONY_WATCHDOG_ONCE", false);

if (!pid && !dryRun) {
  console.error("symphony-watchdog requires --pid or SYMPHONY_PID");
  process.exit(1);
}

const sessions = new Map();

function evaluateRun(state) {
  const running = Array.isArray(state.running) ? state.running : [];
  const totalTokens = Number(state?.codex_totals?.total_tokens || 0);

  if (totalTokens >= hardMaxTotalTokens) {
    return {
      reason: "hard_total_token_cap",
      details: { totalTokens, hardMaxTotalTokens },
    };
  }

  for (const entry of running) {
    const issueIdentifier = entry.issue_identifier || entry.issue_id || "unknown";
    const startedAtMs = Date.parse(entry.started_at || new Date().toISOString());
    const session = sessions.get(issueIdentifier) || {
      issueIdentifier,
      baselineMs: Number.isFinite(startedAtMs) ? startedAtMs : Date.now(),
    };

    if (!session.workspacePath && entry.workspace_path) {
      session.workspacePath = entry.workspace_path;
    }

    session.turnCount = Number(entry.turn_count || 0);
    session.tokens = entry.tokens || {};
    session.startedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : session.baselineMs;
    session.changedFiles = countChangedFiles(session.workspacePath, session.baselineMs);
    sessions.set(issueIdentifier, session);

    const issueTotalTokens = Number(session.tokens.total_tokens || 0);
    const outputTokens = Number(session.tokens.output_tokens || 0);
    const outputRatio = issueTotalTokens > 0 ? outputTokens / issueTotalTokens : 0;
    const runtimeMs = Math.max(0, Date.now() - session.startedAtMs);

    if (issueTotalTokens >= hardMaxIssueTokens) {
      return {
        reason: "hard_issue_token_cap",
        details: { issueIdentifier, issueTotalTokens, hardMaxIssueTokens },
      };
    }

    if (
      session.changedFiles === 0 &&
      runtimeMs >= noCodeRuntimeMs &&
      issueTotalTokens >= noCodeTokenFloor
    ) {
      return {
        reason: "no_code_progress_token_burn",
        details: {
          issueIdentifier,
          runtimeMs,
          issueTotalTokens,
          noCodeTokenFloor,
        },
      };
    }

    if (
      session.changedFiles === 0 &&
      runtimeMs >= noCodeRuntimeMs &&
      issueTotalTokens >= lowOutputFloor &&
      outputRatio < lowOutputRatio
    ) {
      return {
        reason: "low_output_ratio_without_code",
        details: {
          issueIdentifier,
          runtimeMs,
          issueTotalTokens,
          outputTokens,
          outputRatio,
          lowOutputRatio,
        },
      };
    }

    if (
      session.changedFiles === 0 &&
      session.turnCount > maxTurnsWithoutCode &&
      issueTotalTokens >= lowOutputFloor
    ) {
      return {
        reason: "multiple_turns_without_code_changes",
        details: {
          issueIdentifier,
          turnCount: session.turnCount,
          maxTurnsWithoutCode,
          issueTotalTokens,
        },
      };
    }
  }

  return null;
}

async function main() {
  log("watchdog started", {
    pid,
    port,
    intervalMs,
    hardMaxTotalTokens,
    hardMaxIssueTokens,
    noCodeRuntimeMs,
  });

  do {
    if (!dryRun && !isProcessAlive(pid)) {
      log("runtime already exited, watchdog stopping");
      return;
    }

    try {
      const state = await fetchJson(stateUrl, stateFile);
      const decision = evaluateRun(state);

      if (decision) {
        await stopRuntime(pid, decision, dryRun, stopFilePath);
        process.exit(decision.reason === "hard_total_token_cap" ? 70 : 71);
      }
    } catch (error) {
      log("watchdog poll failed", { message: error.message });
    }

    if (!once) {
      await sleep(intervalMs);
    }
  } while (!once);
}

await main();

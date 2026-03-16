import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getArg } from "./common.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const defaultConfig = path.join(repoRoot, "docs", "rag", "projects.json");

function loadConfig(configPath) {
  const abs = path.resolve(configPath);
  if (!fs.existsSync(abs)) {
    return [
      {
        project_key: "ai-ops-for-insurance",
        name: "AI Ops for Insurance",
        root: repoRoot,
        enabled: true
      }
    ];
  }
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(raw.projects)) {
    throw new Error(`Invalid config: ${abs}. Expected { "projects": [...] }`);
  }
  return raw.projects;
}

function validateProject(entry) {
  if (!entry || typeof entry !== "object") return "Entry must be an object.";
  if (!entry.project_key || typeof entry.project_key !== "string") return "project_key is required.";
  if (!entry.name || typeof entry.name !== "string") return "name is required.";
  if (!entry.root || typeof entry.root !== "string") return "root is required.";
  return null;
}

function runIngest(entry, purge) {
  const rootPath = path.resolve(entry.root);
  const args = [
    path.join(repoRoot, "scripts", "rag", "ingest.mjs"),
    "--project",
    entry.project_key,
    "--name",
    entry.name,
    "--root",
    rootPath,
    "--purge",
    purge ? "true" : "false"
  ];

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

function main() {
  const configPath = getArg("config", defaultConfig);
  const selectedProject = getArg("project", "");
  const purge = getArg("purge", "true") !== "false";
  const continueOnError = getArg("continue-on-error", "false") === "true";

  const projects = loadConfig(configPath)
    .filter((item) => item.enabled !== false)
    .filter((item) => (selectedProject ? item.project_key === selectedProject : true));

  if (!projects.length) {
    throw new Error("No enabled projects found for sync.");
  }

  let failed = 0;
  for (const project of projects) {
    const invalid = validateProject(project);
    if (invalid) {
      console.error(`[rag:sync-all] Invalid project entry: ${invalid}`);
      failed += 1;
      if (!continueOnError) process.exit(1);
      continue;
    }

    console.log(`[rag:sync-all] Syncing project ${project.project_key} from ${path.resolve(project.root)}`);
    const status = runIngest(project, purge);
    if (status !== 0) {
      failed += 1;
      if (!continueOnError) process.exit(status);
    }
  }

  if (failed > 0) {
    throw new Error(`Sync completed with ${failed} failure(s).`);
  }

  console.log("[rag:sync-all] Completed successfully.");
}

main();

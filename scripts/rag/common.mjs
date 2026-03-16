import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const RAG_ENV_PATH = path.join(REPO_ROOT, "infra", "rag", ".env");

function parseDotEnv(content) {
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadRagEnv() {
  const ragEnv = fs.existsSync(RAG_ENV_PATH)
    ? parseDotEnv(fs.readFileSync(RAG_ENV_PATH, "utf8"))
    : {};

  const get = (key, fallback = "") => process.env[key] || ragEnv[key] || fallback;

  let pgHost = get("RAG_PG_HOST", "localhost");
  if (pgHost === "host.docker.internal") {
    pgHost = "localhost";
  }

  return {
    ragDbName: get("RAG_DB_NAME", "ai_ops_rag"),
    ragDbUser: get("RAG_DB_USER", ""),
    ragDbPassword: get("RAG_DB_PASSWORD", ""),
    ragDbSchema: get("RAG_DB_SCHEMA", "rag"),
    ragPgHost: pgHost,
    ragPgPort: Number.parseInt(get("RAG_PG_PORT", "5432"), 10),
    qdrantUrl: get("QDRANT_URL", `http://localhost:${get("QDRANT_PORT", "6333")}`),
    qdrantCollection: get("QDRANT_COLLECTION", "ai_ops_memory"),
    openaiApiKey: get("OPENAI_API_KEY", ""),
    openaiEmbeddingModel: get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
  };
}

export function getArg(name, fallback = "") {
  const full = `--${name}=`;
  const idx = process.argv.findIndex((arg) => arg === `--${name}` || arg.startsWith(full));
  if (idx === -1) return fallback;
  const arg = process.argv[idx];
  if (arg === `--${name}`) return process.argv[idx + 1] ?? fallback;
  return arg.slice(full.length);
}

export function assertSchemaName(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid schema name: ${name}`);
  }
}

export async function createPgClient(cfg) {
  assertSchemaName(cfg.ragDbSchema);
  const client = new Client({
    host: cfg.ragPgHost,
    port: cfg.ragPgPort,
    user: cfg.ragDbUser,
    password: cfg.ragDbPassword,
    database: cfg.ragDbName
  });
  await client.connect();
  await client.query(`SET search_path TO ${cfg.ragDbSchema}, public`);
  return client;
}

export async function qdrantRequest(cfg, method, endpoint, body) {
  const response = await fetch(`${cfg.qdrantUrl}${endpoint}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant request failed ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return await response.json();
}

export async function getCollectionInfo(cfg) {
  try {
    const result = await qdrantRequest(cfg, "GET", `/collections/${cfg.qdrantCollection}`);
    return result?.result ?? null;
  } catch (error) {
    if (String(error).includes("404")) return null;
    throw error;
  }
}

export async function ensureCollection(cfg, vectorSize) {
  const info = await getCollectionInfo(cfg);
  if (!info) {
    await qdrantRequest(cfg, "PUT", `/collections/${cfg.qdrantCollection}`, {
      vectors: {
        size: vectorSize,
        distance: "Cosine"
      }
    });
    return;
  }

  const currentSize = info?.config?.params?.vectors?.size;
  if (typeof currentSize === "number" && currentSize !== vectorSize) {
    throw new Error(
      `Qdrant collection "${cfg.qdrantCollection}" has vector size ${currentSize}, but embedder produced ${vectorSize}.`
    );
  }
}

function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((acc, value) => acc + value * value, 0));
  if (!norm) return vec;
  return vec.map((value) => value / norm);
}

function pseudoEmbed(text, dim = 256) {
  const vec = new Array(dim).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    const hash = createHash("sha256").update(token).digest();
    const idx = hash.readUInt16BE(0) % dim;
    const sign = hash[2] % 2 === 0 ? 1 : -1;
    vec[idx] += sign * (1 + (hash[3] % 7) / 10);
  }
  return normalize(vec);
}

async function openAiEmbed(text, cfg) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.openaiApiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: cfg.openaiEmbeddingModel
    })
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`OpenAI embeddings request failed ${response.status}: ${textBody}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function embedText(text, cfg, expectedSize = null) {
  if (cfg.openaiApiKey) {
    return await openAiEmbed(text, cfg);
  }
  const size = expectedSize && Number.isInteger(expectedSize) ? expectedSize : 256;
  return pseudoEmbed(text, size);
}

export function collectKnowledgeFiles(rootDir) {
  const files = [];
  const ignores = new Set([".git", "node_modules", ".next", "dist", "coverage", ".turbo"]);
  const explicit = [
    "README.md",
    "ARCHITECTURE_OVERVIEW.md",
    "WORKFLOW.md",
    "docs/lessons-learned.md",
    "docs/handoff.md",
    "docs/rag/critical-memory.md",
    "apps/submission-triage-copilot/README.md",
    "apps/portfolio-mix-dashboard/README.md"
  ];

  for (const rel of explicit) {
    const abs = path.join(rootDir, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) files.push(abs);
  }

  const docsDir = path.join(rootDir, "docs");
  if (fs.existsSync(docsDir)) {
    const walk = (dir) => {
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.isDirectory()) {
          if (!ignores.has(item.name)) walk(path.join(dir, item.name));
          continue;
        }
        if (item.name.endsWith(".md")) files.push(path.join(dir, item.name));
      }
    };
    walk(docsDir);
  }

  return Array.from(new Set(files)).sort();
}

export function chunkText(text, maxChars = 1200) {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n{2,}/g);
  const chunks = [];
  let current = "";
  for (const para of paragraphs) {
    if (!current) {
      current = para;
      continue;
    }
    if ((current + "\n\n" + para).length <= maxChars) {
      current += `\n\n${para}`;
    } else {
      chunks.push(current.trim());
      current = para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function relPath(fromRoot, filePath) {
  return path.relative(fromRoot, filePath).replaceAll("\\", "/");
}

export function pointId(projectKey, chunkId) {
  return Number.parseInt(String(chunkId), 10);
}

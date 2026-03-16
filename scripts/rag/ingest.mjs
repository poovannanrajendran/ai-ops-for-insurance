import fs from "node:fs";
import path from "node:path";
import {
  chunkText,
  collectKnowledgeFiles,
  createPgClient,
  embedText,
  ensureCollection,
  getArg,
  loadRagEnv,
  pointId,
  qdrantRequest,
  relPath
} from "./common.mjs";

async function main() {
  const cfg = loadRagEnv();
  const projectKey = getArg("project", "ai-ops-for-insurance");
  const projectName = getArg("name", "AI Ops for Insurance");
  const root = path.resolve(getArg("root", process.cwd()));
  const purge = getArg("purge", "true") !== "false";

  if (!cfg.ragDbUser || !cfg.ragDbPassword) {
    throw new Error("RAG DB credentials are missing. Set RAG_DB_USER and RAG_DB_PASSWORD in infra/rag/.env.");
  }

  const files = collectKnowledgeFiles(root);
  if (!files.length) {
    throw new Error(`No files found to ingest from ${root}`);
  }

  const pg = await createPgClient(cfg);
  try {
    await pg.query("BEGIN");
    await pg.query(
      `
      INSERT INTO projects (project_key, name, source_root)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_key)
      DO UPDATE SET name = EXCLUDED.name, source_root = EXCLUDED.source_root, updated_at = now()
      `,
      [projectKey, projectName, root]
    );

    if (purge) {
      await pg.query("DELETE FROM documents WHERE project_key = $1", [projectKey]);
      await qdrantRequest(cfg, "POST", `/collections/${cfg.qdrantCollection}/points/delete`, {
        filter: { must: [{ key: "project_key", match: { value: projectKey } }] }
      }).catch(() => null);
    }

    const chunkRows = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const docChunks = chunkText(content, 1200);
      if (!docChunks.length) continue;

      const sourcePath = relPath(root, file);
      const docInsert = await pg.query(
        `
        INSERT INTO documents (project_key, source_path, source_type, title, metadata)
        VALUES ($1, $2, 'markdown', $3, '{}'::jsonb)
        RETURNING id
        `,
        [projectKey, sourcePath, path.basename(file)]
      );
      const documentId = docInsert.rows[0].id;

      for (const [index, chunk] of docChunks.entries()) {
        const chunkInsert = await pg.query(
          `
          INSERT INTO chunks (project_key, document_id, chunk_index, content, token_count, metadata)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          RETURNING id
          `,
          [
            projectKey,
            documentId,
            index,
            chunk,
            chunk.split(/\s+/).filter(Boolean).length,
            JSON.stringify({ source_path: sourcePath })
          ]
        );

        chunkRows.push({
          chunkId: Number.parseInt(String(chunkInsert.rows[0].id), 10),
          sourcePath,
          chunkIndex: index,
          content: chunk
        });
      }
    }

    if (!chunkRows.length) {
      throw new Error("No chunks generated for ingestion.");
    }

    const firstEmbedding = await embedText(chunkRows[0].content, cfg);
    await ensureCollection(cfg, firstEmbedding.length);

    const points = [
      {
        id: pointId(projectKey, chunkRows[0].chunkId),
        vector: firstEmbedding,
        payload: {
          project_key: projectKey,
          chunk_id: chunkRows[0].chunkId,
          source_path: chunkRows[0].sourcePath,
          chunk_index: chunkRows[0].chunkIndex
        }
      }
    ];

    for (const row of chunkRows.slice(1)) {
      const vector = await embedText(row.content, cfg, firstEmbedding.length);
      points.push({
        id: pointId(projectKey, row.chunkId),
        vector,
        payload: {
          project_key: projectKey,
          chunk_id: row.chunkId,
          source_path: row.sourcePath,
          chunk_index: row.chunkIndex
        }
      });
    }

    const batchSize = 64;
    for (let start = 0; start < points.length; start += batchSize) {
      const batch = points.slice(start, start + batchSize);
      await qdrantRequest(cfg, "PUT", `/collections/${cfg.qdrantCollection}/points`, {
        points: batch
      });
    }

    await pg.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          status: "ok",
          projectKey,
          filesIngested: files.length,
          chunksIngested: chunkRows.length,
          embeddingMode: cfg.openaiApiKey ? "openai" : "local-hash",
          qdrantCollection: cfg.qdrantCollection
        },
        null,
        2
      )
    );
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

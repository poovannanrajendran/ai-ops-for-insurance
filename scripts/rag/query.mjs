import { createPgClient, embedText, getArg, getCollectionInfo, loadRagEnv, qdrantRequest } from "./common.mjs";

async function main() {
  const cfg = loadRagEnv();
  const projectKey = getArg("project", "ai-ops-for-insurance");
  const queryText = getArg("q", "").trim();
  const k = Number.parseInt(getArg("k", "8"), 10);

  if (!queryText) {
    throw new Error("Query text is required. Example: pnpm rag:query -- --project ai-ops-for-insurance --q \"vercel output directory\" --k 8");
  }
  if (!cfg.ragDbUser || !cfg.ragDbPassword) {
    throw new Error("RAG DB credentials are missing. Set RAG_DB_USER and RAG_DB_PASSWORD in infra/rag/.env.");
  }

  const info = await getCollectionInfo(cfg);
  if (!info) {
    throw new Error(`Qdrant collection "${cfg.qdrantCollection}" not found. Run ingestion first.`);
  }
  const vectorSize = info?.config?.params?.vectors?.size ?? null;

  const vector = await embedText(queryText, cfg, vectorSize);
  const qdrantResult = await qdrantRequest(cfg, "POST", `/collections/${cfg.qdrantCollection}/points/search`, {
    vector,
    limit: k,
    with_payload: true,
    filter: {
      must: [{ key: "project_key", match: { value: projectKey } }]
    }
  });

  const points = qdrantResult?.result ?? [];
  const chunkIds = points
    .map((point) => point?.payload?.chunk_id)
    .filter((id) => Number.isInteger(id));

  if (!chunkIds.length) {
    console.log(
      JSON.stringify(
        {
          status: "ok",
          projectKey,
          query: queryText,
          results: []
        },
        null,
        2
      )
    );
    return;
  }

  const pg = await createPgClient(cfg);
  try {
    const rows = await pg.query(
      `
      SELECT c.id, c.content, c.metadata, d.source_path
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.id = ANY($1::bigint[])
      `,
      [chunkIds]
    );

    const byId = new Map(rows.rows.map((row) => [Number(row.id), row]));
    const merged = points
      .map((point) => {
        const chunkId = Number(point?.payload?.chunk_id);
        const row = byId.get(chunkId);
        if (!row) return null;
        return {
          score: point.score,
          chunkId,
          sourcePath: row.source_path,
          excerpt: String(row.content).slice(0, 600)
        };
      })
      .filter(Boolean);

    await pg.query(
      `
      INSERT INTO query_log (project_key, query, top_k, retrieval_mode, response_ms, metadata)
      VALUES ($1, $2, $3, $4, NULL, $5::jsonb)
      `,
      [projectKey, queryText, k, cfg.openaiApiKey ? "semantic-openai" : "semantic-local-hash", JSON.stringify({ result_count: merged.length })]
    );

    console.log(
      JSON.stringify(
        {
          status: "ok",
          projectKey,
          query: queryText,
          embeddingMode: cfg.openaiApiKey ? "openai" : "local-hash",
          results: merged
        },
        null,
        2
      )
    );
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

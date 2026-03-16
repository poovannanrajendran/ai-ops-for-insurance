# Shared RAG Infrastructure

This stack is designed for cross-project memory with project-level focus:

- **Qdrant** stores vector embeddings.
- **Existing Postgres** stores metadata, chunk registry, and query logs in a dedicated DB (`ai_ops_rag` by default).

## 1) Configure

```sh
cd infra/rag
cp .env.example .env
```

Update `.env` with your existing Docker Postgres admin connection.

## 2) Start Qdrant

```sh
docker compose up -d qdrant
```

## 3) Create separate RAG database on existing Postgres

```sh
docker compose --profile setup run --rm rag-db-init
```

This is idempotent and will:

- create role `RAG_DB_USER` if missing
- create database `RAG_DB_NAME` if missing
- create schema/tables for project-scoped RAG metadata

## 4) Project focus model

Use `project_key` as the first-class filter in your retrieval layer.

- Single project focus: always query/filter by one `project_key`.
- Cross-project mode: include multiple `project_key` values or no filter.

## 5) Ingestion and query service scripts

From repo root:

```sh
pnpm rag:ingest -- --project ai-ops-for-insurance --name "AI Ops for Insurance"
pnpm rag:query -- --project ai-ops-for-insurance --q "vercel output directory public warning" --k 8
```

Behavior:

- Uses Postgres `rag` schema tables for document/chunk metadata.
- Uses Qdrant collection (`QDRANT_COLLECTION`) for vector search.
- Enforces project focus with `project_key` filter.
- If `OPENAI_API_KEY` is set, uses OpenAI embeddings.
- If not set, uses a deterministic local hash embedding fallback (works offline, lower quality).

## Notes

- `host.docker.internal` works on macOS and Docker Desktop.
- If Postgres is on a Docker network with a service/container name, set `RAG_PG_HOST` to that name instead.
- If you run `psql` from your host shell (not from Docker), use `localhost` instead of `host.docker.internal`.

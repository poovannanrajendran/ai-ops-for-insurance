# RAG Guardrails

## Scope Guardrails

- Always pass `project_key` on ingestion and query commands.
- Default mode is **project-focused** retrieval.
- Use cross-project retrieval only when explicitly requested.

## Data Guardrails

- Ingest only project documentation and operational notes by default.
- Avoid ingesting raw secret files (`.env`, keys, tokens, credentials).
- Do not ingest files that contain production customer PII unless explicitly approved.

## Quality Guardrails

- Re-run `rag:ingest` after major docs, architecture, or lessons updates.
- Keep `docs/lessons-learned.md` and `docs/rag/critical-memory.md` current.
- Add durable operational decisions to RAG docs, not only chat messages.

## Retrieval Guardrails

- Prefer source-backed answers that cite `sourcePath`.
- Treat retrieval results as context, not immutable truth.
- For time-sensitive facts, verify against the current source file before acting.

## Operations Guardrails

- Keep Qdrant persistent volume enabled.
- Keep RAG DB separate (`ai_ops_rag`) from application transactional schemas.
- Use least-privilege DB users and explicit schema grants/default privileges.
- Follow `docs/app-build-quality-checklist.md` as the default build and UI standard for every new day app.
- For every new day app, create both:
  - `<schema>.app_<shortname>_analysis_runs`
  - `<schema>.app_<shortname>_audit`
- Route handlers should write audit stages at minimum: `request_received`, `analysis_completed`, and failure stage (`validation_failed` or `analysis_failed`).

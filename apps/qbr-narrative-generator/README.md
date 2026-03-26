# Day 26 - QBR Narrative Generator

Deterministically converts quarterly metrics into executive narrative, board talking points, and query snippets.

## Run

```bash
pnpm --filter @ai-ops/qbr-narrative-generator dev
```

## DB init

Run:

```sql
\i apps/qbr-narrative-generator/db/init_qbrnarrative.sql
```

Expose schema `app_qbrnarrative` in Supabase Data API.

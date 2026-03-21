# Treaty Structure Explainer (Day 12)

## Local dev

```bash
pnpm --filter @ai-ops/treaty-structure-explainer dev
```

## Database bootstrap

Run:

```sql
-- file: apps/treaty-structure-explainer/db/init_treatystructure.sql
```

Then expose schema in Supabase Data API:
- `app_treatystructure`

## What it does
- Parses treaty wording into structured terms.
- Builds deterministic layer flow and loss walkthrough scenarios.
- Surfaces warnings and query-matched snippets.
- Persists analysis and non-blocking audit stages when Supabase credentials are configured.

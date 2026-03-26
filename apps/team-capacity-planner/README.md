# Day 27 - Team Capacity Planner

Deterministically converts staffing and workload inputs into capacity state, allocation narrative, and action plan outputs.

## Run

```bash
pnpm --filter @ai-ops/team-capacity-planner dev
```

## DB init

```sql
\i apps/team-capacity-planner/db/init_teamcapacity.sql
```

Expose schema `app_teamcapacity` in Supabase Data API.

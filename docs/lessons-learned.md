# Lessons Learned

## 2026-03-15 - Supabase schema exposure and permissions
- Creating a new schema is not enough. You must explicitly expose the schema under Supabase **API → Data API** or REST calls return `Invalid schema`.
- After exposing, grant usage and table privileges to the runtime roles (`service_role`, `anon`, `authenticated`) or REST calls return `permission denied for schema`.


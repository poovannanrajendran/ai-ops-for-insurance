# Day 17 Execution Plan - MRC Checker

## Objective
- Build and ship **MRC Checker**.

## Scope
- Contract and wording compliance checks against MRC standards.
- Supabase persistence and audit logging.
- Data API exposure verification for `app_mrcchecker`.

## Deliverables
- App in `apps/mrc-checker`
- DB init in `apps/mrc-checker/db/init_mrcchecker.sql`
- Vercel deploy + smoke verification

## SQL bootstrap checklist
1. Apply the app init SQL in Supabase.
2. Confirm schema `app_mrcchecker` exists.
3. Confirm `app_mrcchecker_analysis_runs` and `app_mrcchecker_audit` exist.
4. Add `app_mrcchecker` to the Supabase Data API exposure list.
5. Reload PostgREST and verify `Accept-Profile: app_mrcchecker` works.

## Verification snippets
```sql
select schema_name
from information_schema.schemata
where schema_name = 'app_mrcchecker';

select table_name
from information_schema.tables
where table_schema = 'app_mrcchecker'
  and table_name in ('app_mrcchecker_analysis_runs', 'app_mrcchecker_audit')
order by table_name;
```

```sql
select *
from app_mrcchecker.app_mrcchecker_analysis_runs
order by created_at desc
limit 5;

select *
from app_mrcchecker.app_mrcchecker_audit
order by created_at desc
limit 10;

select stage, count(*) as row_count
from app_mrcchecker.app_mrcchecker_audit
group by stage
order by stage;
```

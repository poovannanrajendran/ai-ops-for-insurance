# Day 27 Execution Plan - Team Capacity Planner

- Bucket: Leadership / Team Ops
- Objective: Generate deterministic capacity state and actionable allocation plan from team workload data.
- Inputs: key-value capacity fields (team size, FTE capacity, queue, cycle days, overtime, specialist gaps).
- Outputs: capacity state, allocation narrative, action plan, warnings, query snippets, whitespace table.
- Persistence: `app_teamcapacity.app_teamcapacity_analysis_runs` and `app_teamcapacity_audit`.
- Gates: unit tests, route tests, lint, typecheck, build, visual smoke/alignment contracts.

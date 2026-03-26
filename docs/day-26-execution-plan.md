# Day 26 Execution Plan - QBR Narrative Generator

- Bucket: Productivity
- Objective: Convert core quarter metrics into deterministic board-ready narrative.
- Inputs: key-value metric text (GWP, loss ratio, NTU, combined ratio, retention, premium trend, open claims).
- Outputs: executive narrative, board talking points, query snippets, warnings, whitespace table.
- Persistence: `app_qbrnarrative.app_qbrnarrative_analysis_runs` plus audit table.
- Gates: unit tests, route tests, lint, typecheck, build, visual smoke/alignment contracts.

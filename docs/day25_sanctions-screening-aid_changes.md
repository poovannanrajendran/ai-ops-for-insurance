# Day 25 — Sanctions Screening Aid (Changes)

## Implemented
- New app package: `@ai-ops/sanctions-screening-aid` (port 3025)
- Deterministic screening service with token-overlap similarity against static watchlists
- API route `/api/sanctionsscreening/analyze` with timeout wrapper, persistence, and audit logging
- Full UI aligned to project design contract (symmetric intake, status dots, full-width whitespace table)
- DB bootstrap script for schema `app_sanctionsscreening`
- Balanced/high-risk/missing sample packs and provenance note
- Positive/negative unit and route tests with timeout marker coverage

## Lessons applied
- Maintain block/review/clear state cues with green/amber/red dots in header cards
- Keep right-pane naming and left-pane naming selector-safe for visual contracts
- Include required-field gate and persistence audits in route tests

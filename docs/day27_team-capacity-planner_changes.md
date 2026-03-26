# Day 27 - Team Capacity Planner - Changes

## Implemented

- New app scaffold: `apps/team-capacity-planner`
- Deterministic capacity analyzer and warning logic.
- API route with timeout, persistence, and audit logging.
- UI aligned to day-series design (header status dots, split intake, whitespace table).
- DB bootstrap script and synthetic samples.
- Unit and route tests.

## Notes

- Overload classification currently triggers on urgent queue, overtime, and low available FTE thresholds.

# Day 21 Execution Plan

## Scope
- Build `apps/meeting-prep-briefing`
- Short name: `meetingprep`
- Schema: `app_meetingprep`
- Port: `3021`

## Day 21 Topic (from roadmap)
- App: `meeting-prep-briefing`
- Summary: Enter client/market details and generate a concise AI-style briefing pack: context, people, risks, and talking points.
- Bucket: Productivity

## Delivery plan
1. Define deterministic parser for client/market briefing input blocks.
2. Generate structured meeting pack sections (context, stakeholders, talking points, risk cues, open questions).
3. Add API route with validation, timeout guard, persistence semantics, and audit logging.
4. Build symmetric intake/results UI with whitespace table and status semantics.
5. Add positive/negative analyzer + route tests and run full QA gates.
6. Add SQL bootstrap, samples, and provenance notes.

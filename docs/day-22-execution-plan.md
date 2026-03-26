# Day 22 Execution Plan

## Scope
- Build `apps/renewal-intelligence-copilot`
- Short name: `renewalcopilot`
- Schema: `app_renewalcopilot`
- Port: `3022`

## Day 22 Topic (from roadmap)
- App: `renewal-intelligence-copilot`
- Summary: Upload policy summary and claims history inputs, then generate renewal strategy direction and talking points.
- Bucket: Underwriting

## Delivery plan
1. Parse renewal pack key fields deterministically.
2. Compute pricing signals from loss ratio, exposure change, market conditions, and controls.
3. Generate strategy memo, negotiation points, and action plan.
4. Add API route with validation, timeout guard, persistence semantics, and audit events.
5. Build symmetric UI with status dots and full-width whitespace table.
6. Add SQL bootstrap, tests, and run strict QA gates.

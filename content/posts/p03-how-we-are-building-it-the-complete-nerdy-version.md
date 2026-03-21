# P03 - How we are building it (the complete nerdy version)

This is the nerdy version: schemas, services, logs, AI routing, and test harnesses all wired together.
If you care about maintainability, the data flow is the product.

A request enters a Next.js API route, gets validated, and is routed to a deterministic service. The service calls typed repositories, optionally invokes AI extract/classify/summarise helpers, writes to app-specific Supabase schemas, and emits structured audit stages. Every app has requestId + appKey logs and explicit persistence status semantics: stored, skipped, failed.

CTA: Comment “nerdy” if you want a per-layer walkthrough with example route + schema contracts.

Hashtags: #InsuranceAI #AIEngineering #DataFlow #NextJS #Supabase

Media:
- assets/diagrams/architecture-nerdy.png
- assets/animations/flow-underwriting.mp4
- assets/logos/github.svg
- assets/logos/docker.svg
- assets/logos/openai.svg

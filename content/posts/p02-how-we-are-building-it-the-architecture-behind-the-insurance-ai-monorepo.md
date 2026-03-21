# P02 - How we are building it: the architecture behind the insurance AI monorepo

Every app starts with the same backbone: a shared platform, not a pile of one-off demos.
The point is to make 30 apps feel like one system, with clear boundaries and reusable parts.

We're building this as a monorepo with shared packages, app-specific schemas, and a consistent layered architecture. Data flows in a straight line: upload or API request -> validation -> repository -> service logic -> AI helper where needed -> response -> structured logs -> persistence in Supabase. That structure keeps each app demoable in minutes and scalable in code quality.

CTA: If you were reviewing this architecture, where would you pressure-test it first?

Hashtags: #InsuranceAI #SoftwareArchitecture #NextJS #Supabase #AIOps

Media:
- assets/diagrams/architecture-business.png
- assets/animations/flow-core.mp4
- assets/logos/vercel.svg
- assets/logos/supabase.svg
- assets/logos/nextdotjs.svg
- assets/logos/typescript.svg

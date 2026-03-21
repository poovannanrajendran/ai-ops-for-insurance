# P01 — Why I'm Building 30 Insurance AI Apps in 30 Days

I spent 19 years watching insurance teams drown in PDFs.

Broker submissions arrive as 40-page packs. Underwriters manually scan for key terms. Claims handlers re-type the same FNOL data three times. Exposure teams stare at spreadsheets hoping the accumulation hotspot reveals itself before the next cat event.

And every six months, someone presents a slide deck about "AI transformation."

I got tired of slides.

So I set myself a challenge: build 30 working AI tools for the London Market in 30 days. Not concept decks. Not Figma prototypes. Production-grade Next.js apps with real data persistence, structured audit trails, and deterministic outputs — deployed and demoable in under three minutes each.

Here is why this matters:

The London Market does not have an AI awareness problem. It has an AI shipping problem. The gap between "we should use AI for triage" and a working tool that actually triages submissions is not budget or strategy. It is engineering discipline and domain specificity.

Every app in this challenge targets a real workflow:
- Submission triage and appetite scoring
- Portfolio concentration warnings
- Slip review and clause extraction
- FNOL classification and routing
- Exposure accumulation heatmaps
- Cat event briefings with loss estimates

I am building this solo, using Claude Code and Codex as my engineering partners — one person, two AI agents, thirty days.

The stack is intentionally boring: Next.js, TypeScript, Tailwind, Supabase, Vercel. No exotic infrastructure. No vendor lock-in. Just clean architecture that any insurance team could adopt.

I will share every build, every lesson, and every failure publicly.

Follow along if you want to see what happens when someone stops talking about AI in insurance and starts shipping it.

---

**CTA:** What workflow would you want an AI tool to handle first — intake triage, document review, or exposure monitoring?

**Hashtags:** #InsuranceAI #LloydsMarket #BuildInPublic #Underwriting #ClaimsOps #AIOps #SpecialtyInsurance #30DayChallenge

**Image prompt (Gemini):** Create a bold, professional LinkedIn hero image. Dark navy background (#0b1730). Centre: a glowing insurance document icon transforming into a digital dashboard with circuit-board traces connecting to 30 small app icons arranged in a 5x6 grid. Each app icon is a minimal white outline (document, heatmap, shield, chart, gavel, magnifying glass). Bottom-left: "30 Apps. 30 Days." in clean white sans-serif. Bottom-right: "AI Ops for Insurance" in teal (#0f766e). Style: tech-forward, London Market professional. No stock photos. No cartoons. Aspect ratio 1200x628.

# 30 Topics 30 Day Challenge Roadmap (Extracted from PDF)

Source PDF: `30-topics-30-day-challenge-roadmap-v4-final.pdf`

## Page 1

30-Day Insurance AI Challenge
Final Roadmap — Poovi Rajendran  |  14 March – 12 April 2026
v4 FINAL — Best-of-three consolidation (ChatGPT + Perplexity + Claude)  |  Value-ordered  |  Arc narrative structure
 30
 5
 8
 10
 Total Apps
 Weeks
 AI Techniques
 Weekend Builds
How This Roadmap Was Built
Dimension
Best Source
Applied In
Infrastructure setup
Claude (Supabase region, schema naming, env vars)
Day 0 bootstrap + all apps
Value-based ordering
ChatGPT's top-10 value scoring, then Claude's domain-grouped flow
Week 1 front-loads highest-signal apps
Career narrative
Claude's Arc Narrative structure (5-week story)
Week themes + arc reasoning
Master prompt
Perplexity prompt (incorporates all feedback)
System prompt for all builds
Visualisation
Perplexity's PDF style (statistics, charts, domain breakdown)
This document (v4)
Topic selection
Three-way merge: 90 ideas mapped, 28 from Claude + 2 from
ChatGPT
Final 30 + 9 reserves
Changes in v4
1. Value-based ordering: Following Perplexity's recommendation, Week 1 now front-loads the highest-value apps (as scored by
ChatGPT's research), then flows into domain groups.
2. Day 10 enhanced: claims-fnol-extractor now includes a conversational chatbot option (paste FNOL email or guided chat intake),
blending the best of ChatGPT's intake chatbot idea.
3. Statistics & charts: Added Perplexity-style visual breakdowns (domain pie, complexity split, AI techniques, value signal by week).
4. Source attribution table: Documents which source contributed each dimension.

## Page 2

Challenge Overview & Statistics
Key Metrics
Metric
Value
Total apps
30 (+ 9 reserves)
Avg per week
~6-7 apps
Weekend builds (ambitious)
10 apps (10-14h each)
Weekday builds (focused)
20 apps (1-3h each)
Lloyd's/Underwriting coverage
8 apps (27%)
AI techniques used
8 distinct techniques across portfolio
Apps with document intelligence
15 (50%)
Apps with interactive visualisation
7 (23%)

## Page 3

Infrastructure Decisions
Source: Claude (locked in during planning phase)
Decision
Choice
Supabase plan
Free tier
Supabase region
London (eu-west-2)
Namespacing
Separate schema per app (app_)
Auth
Off by default; enable per-app when needed
Shared project
Single project for all 30 apps + app_shared audit schema
Env vars
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (shared)
Frontend
Next.js (latest stable) + React + Tailwind
AI providers
OpenAI / Anthropic (per-app choice based on best fit)
Hosting
Vercel Hobby tier (primary); GitHub Pages for static/docs
Testing
TDD with Jest/Vitest; test files alongside implementation
Process
Linear mental model (epics, issues, acceptance criteria)
Priority Bucket Distribution
#
Bucket
Priority
Days
%
1
Lloyd's / Specialty Underwriting
Highest
8
27%
2
Exposure Management
High
4
13%
3
Claims Ops
High
4
13%
4
Broking / Placement
Medium
4
13%
5
Productivity & Automation
Medium
5
17%
6
Leadership / Team Ops
Lower
2
7%
7
General Insurance / Compliance
Lower
3
10%

## Page 4

30-Day Schedule
Ordering: Value-based (ChatGPT's top-10 first) then domain-grouped (Claude's arc narrative). Source: Three-way consolidation.
■ Weekend build (10–14h)   ■ Swapped in from ChatGPT   ■ Enhanced from v3   WE = Weekend   WD = Weekday
Week 1: 14–20 March — UNDERWRITING CORE
"I understand the heart of Lloyd's — risk selection, appetite, and portfolio management."
Day
Date
Type
App Name
Summary
Bucket
1
Sat 14 Mar
WE
submission-triage-copilot
Upload broker submission docs → AI extracts key fields → scores fit
against risk appetite → recommends accept/refer/decline with reasoning.
UW
2
Sun 15 Mar
WE
portfolio-mix-dashboard
Upload portfolio CSV → AI analyses class/territory/limit distribution →
dashboard with concentration warnings + natural-language commentary.
UW
3
Mon 16 Mar
WD
risk-appetite-parser
Upload risk appetite statement (PDF/text) → structured breakdown of
classes, territories, limits, exclusions via LLM. Supports Q&A queries.
UW
4
Tue 17 Mar
WD
slip-reviewer
Paste/upload Lloyd's MRC slip → AI summary highlighting key terms,
unusual clauses, coverage gaps.
UW
5
Wed 18 Mar
WD
class-of-business-classifi
er
Enter free-text risk description → suggested Lloyd's class-of-business
code with confidence + reasoning.
UW
6
Thu 19 Mar
WD
exposure-accumulation-h
eatmap
Upload CSV of insured locations + TIV → interactive heatmap showing
accumulation hotspots.
EX
7
Fri 20 Mar
WD
cat-event-briefing
Enter catastrophe event → AI briefing: facts, affected classes, loss
estimates, suggested actions.
EX
Week 2: 21–27 March — CLAIMS & EXPOSURE DEEP DIVE
"I apply AI across the full policy lifecycle — not just front-office."
Day
Date
Type
App Name
Summary
Bucket
8
Sat 21 Mar
WE
coverholder-oversight-hu
b
Upload bordereaux → AI checks compliance against binding authority
terms → exception reports + traffic lights.
UW
9
Sun 22 Mar
WE
claims-timeline-reconstru
ctor
Upload claims file (multiple docs) → AI builds chronological timeline,
flags delays, highlights subrogation.
CL
10
Mon 23 Mar
WD
claims-fnol-extractor +
Paste FNOL email or walk through guided chat intake → AI extracts
structured claim fields. Dual-mode: paste + conversational.
CL
11
Tue 24 Mar
WD
claims-reserve-advisor
Given structured claim details → AI suggests initial reserve range with
reasoning + synthetic precedents.
CL
12
Wed 25 Mar
WD
treaty-structure-explainer
Enter treaty structure → visual diagram + plain-English loss flow
explanation.
UW
13
Thu 26 Mar
WD
exposure-clash-detector
Upload two+ policy/location schedules → identify overlapping exposures
and clash risk.
EX
14
Fri 27 Mar
WD
claims-leakage-flagger
Upload claims bordereaux CSV → AI flags leakage indicators: late
notifications, reserve inadequacy, duplicates.
CL
Week 3: 28 Mar–3 April — BROKING, PLACEMENT & MARKET
"I understand market connectivity — how submissions flow, placements progress, and regulation impacts the
business."
Day
Date
Type
App Name
Summary
Bucket
15
Sat 28 Mar
WE
broker-submission-builde
r
Guided wizard to structure broker submission → AI generates polished
submission with all Lloyd's market fields.
BR
16
Sun 29 Mar
WE
exposure-scenario-modell
er
Upload portfolio + define scenario → AI estimates impact, shows
affected policies, generates management summary.
EX
17
Mon 30 Mar
WD
market-reform-contract-c
hecker
Paste contract doc → AI checks MRC standards, flags non-compliance
with fixes.
BR

## Page 5

Day
Date
Type
App Name
Summary
Bucket
18
Tue 31 Mar
WD
placement-status-tracker
Kanban board for placement progress → syndicate statuses + AI
follow-up suggestions.
BR
19
Wed 1 Apr
WD
wordings-diff-tool
Upload two wording versions → AI highlights material differences +
practical impact.
BR
20
Thu 2 Apr
WD
regulatory-update-digest
Lloyd's/PRA/FCA feeds → AI summarises updates, flags relevance by
class.
GI
21
Fri 3 Apr
WD
meeting-prep-briefing
Enter client/market name → AI briefing pack: news, position, key people,
talking points.
PR
Week 4: 4–10 April — PRODUCTIVITY, LEADERSHIP & SYNTHESIS
"I think beyond individual tools — I build for strategy, operations, compliance, and leadership."
Day
Date
Type
App Name
Summary
Bucket
22
Sat 4 Apr
WE
renewal-intelligence-copil
ot
Upload policy summary + claims history → AI renewal strategy memo
with pricing direction + talking points.
UW
23
Sun 5 Apr
WE
ops-health-monitor
Define KPIs → upload data → AI trend analysis, anomaly detection, ops
briefing dashboard.
PR
24
Mon 6 Apr
WD
data-quality-validator *
Upload any insurance data file (bordereaux, submissions, schedules) →
AI validates schema, checks conventions, flags anomalies, suggests
fixes.
GI
25
Tue 7 Apr
WD
sanctions-screening-aid *
Enter insured/entity name → fuzzy-match against public sanctions lists
(OFAC, EU, HMT) → risk flag with confidence + next steps.
GI
26
Wed 8 Apr
WD
qbr-narrative-generator
Input key metrics (GWP, loss ratio, NTU rate) → AI generates
professional QBR narrative paragraph.
PR
27
Thu 9 Apr
WD
team-capacity-planner
Enter team, skills, workload → AI optimal allocation + overload flags.
LD
28
Fri 10 Apr
WD
stakeholder-comms-draft
er
Select comms type + bullets → AI polished message for target audience.
LD
Week 5: 11–12 April — CAPSTONE
"I can assess AI maturity and present a coherent body of work."
Day
Date
Type
App Name
Summary
Bucket
29
Sat 11 Apr
WE
insurance-ai-readiness-sc
orer
Answer maturity questions → AI Readiness Score + personalised
roadmap of quick wins and strategic investments.
PR
30
Sun 12 Apr
WE
challenge-portfolio-showc
ase
Interactive portfolio page showcasing all 30 apps → filterable, with
problem/persona/tech cards and demo links.
PR

## Page 6

Arc Narrative — The Story This Portfolio Tells
Source: Claude's arc narrative structure
Week 1 — Underwriting Core (Days 1–7)
"I understand the heart of Lloyd's — risk selection, appetite, and portfolio management."
Starting with the highest-signal topic establishes credibility. The submission triage copilot and portfolio dashboard are
headline pieces. Supporting apps show breadth across underwriting workflows. The exposure heatmap and cat briefing
demonstrate awareness of accumulation risk.
Week 2 — Claims & Exposure Deep Dive (Days 8–14)
"I apply AI across the full policy lifecycle — not just front-office."
Coverholder oversight tackles a real DA pain point. Claims timeline reconstructor shows document intelligence. The
enhanced FNOL extractor (Day 10) demonstrates dual-mode AI interaction: document parsing and conversational
intake. Treaty explainer, clash detector, and leakage flagger round out the operational coverage.
Week 3 — Broking, Placement & Market (Days 15–21)
"I understand market connectivity — how submissions flow and regulation impacts the business."
The broker submission builder complements Week 1's triage tool, showing both sides of the broker–underwriter
dynamic. Exposure scenario modeller bridges risk management and board reporting. MRC checker, placement tracker,
wordings diff, regulatory digest, and meeting prep cover daily operational needs.
Week 4 — Productivity, Leadership & Synthesis (Days 22–28)
"I think beyond individual tools — I build for strategy, operations, compliance, and leadership."
Renewal intelligence copilot is the most commercially valuable app. Data quality validator (swapped in from ChatGPT)
tackles the foundational AI blocker. Sanctions screening aid adds a compliance dimension with a distinct AI technique
(fuzzy entity matching). QBR generator, capacity planner, and comms drafter show management-level thinking.
Week 5 — Capstone (Days 29–30)
"I can assess AI maturity and present a coherent body of work."
The AI readiness scorer positions you as an AI strategy advisor. The portfolio showcase ties everything into a living CV
piece. Together they transform 30 projects into a professional narrative.

## Page 7

Design Reasoning
Value-based ordering (v4 change)
Perplexity recommended starting with ChatGPT's highest-value-scored apps rather than purely grouping by domain.
The v4 schedule achieves this: Week 1 front-loads submission triage (scored 9/10 by ChatGPT for profile signal) and
portfolio dashboard. The remaining weeks still follow Claude's domain-grouped arc, but within each week the
highest-value apps land on weekend slots.
Day 10 dual-mode enhancement (v4 change)
ChatGPT's 'Claims Intake Chatbot' idea was not strong enough for a standalone app, but the conversational UX angle
is valuable. Day 10 now offers paste-an-email OR guided-chat intake, demonstrating two AI interaction patterns in one
app.
Why data-quality-validator over bordereaux-validator? (v3 swap, retained)
Only 17% of insurers operate unified data platforms. A broader tool that validates any insurance data file is more useful
and higher signal for an AI Ops role. It still handles bordereaux as one type.
Why sanctions-screening-aid over insurance-jargon-decoder? (v3 swap, retained)
Sanctions screening is a regulatory must-have. Fuzzy entity matching diversifies the AI techniques beyond
summarisation/extraction. The jargon decoder moves to reserves.
Why we disagree with ChatGPT on some rejections
Treaty-structure-explainer: ChatGPT rejected it as duplicating slip review. We kept it because treaty/reinsurance
structures are fundamentally different from direct slip review — different users, different workflows.
Sanctions screening: ChatGPT called it a 'rules-based lookup.' We disagree — fuzzy entity matching across aliases,
transliterations, and partial names is genuinely an NLP problem.
Meeting minutes summariser: ChatGPT included it. We excluded it as the most generic AI demo possible with
near-zero insurance signal.
Three-source consolidation methodology
All 90 ideas from ChatGPT, Perplexity, and Claude were mapped for overlaps. 28 of Claude's original 30 survived. Two
slots were upgraded with ChatGPT ideas. Nine reserves from all three sources provide flexibility.

## Page 8

Cross-Cutting Themes & AI Techniques
Theme / AI Technique
Days
Count
Document intelligence (parsing, extraction, summarisation)
1, 2, 3, 4, 6, 8, 9, 10, 12, 14, 15, 17, 19, 22, 24
15
Summarisation & narrative generation
2, 7, 9, 16, 22, 23, 26, 29
8
Interactive visualisation
2, 6, 12, 16, 18, 23, 30
7
RAG / knowledge retrieval
3, 5, 7, 20, 21, 25
6
Classification & scoring
1, 5, 10, 14, 25
5
Agentic / multi-step reasoning
1, 9, 16, 22, 29
5
Data validation & quality assurance
8, 14, 24
3
Fuzzy entity matching / NLP
25
1
Reserve Ideas (9 apps)
Reserve Idea
Summary
Source
Replaces
insurance-jargon-decoder
Enter jargon → clear explanation with examples.
Claude v2
Day 25
endorsement-drafter
AI drafts endorsement wording + pro-rata premium
adjustment.
Claude v1
Day 19/12
loss-ratio-triangulator
Upload loss data → triangles + ultimate projections.
Claude v1
Day 11/14
sla-breach-predictor
Predict SLA breaches from queue/throughput.
Claude v1
Day 27/23
market-bulletin-summariser
Paste Lloyd's Bulletin → summary + actions.
Claude v1
Day 20
exposure-data-gap-finder
Identify missing fields in exposure schedules.
Perplexity
Day 13
smart-follow-visualiser
Visualise capacity in smart follow facilities.
ChatGPT
Day 18
risk-submission-quality-sco
recard
Score submission completeness and data richness.
Perplexity
Day 1
facility-efficiency-advisor
AI advises facility vs open market placement.
ChatGPT
Day 18/19
Cross-App Reuse (Optional)
Later App
Can Reuse From
What
Day 1 (submission-triage)
Day 3 (risk-appetite-parser)
Parsed appetite as scoring baseline
Day 8 (coverholder-oversight)
Day 24 (data-quality-validator)
Validation logic for bordereaux
Day 16 (exposure-scenario)
Day 6 (heatmap)
Location/accumulation data patterns
Day 22 (renewal-copilot)
Day 4 (slip-reviewer)
Slip parsing logic
Day 30 (loss-ratio-triangulator)
All apps
Links, metadata, screenshots

## Page 9

Next Steps
1. Run Day 0 Supabase bootstrap (15–20 min): create project in London region, verify schemas, set up app_shared
audit log.
2. Day 1 kickoff (Sat 14 March): detailed architecture for submission-triage-copilot → Linear plan → tests → build.
3. Each day: ideas → architecture → Linear plan → tests → build (on your signal) → deploy → LinkedIn/X post.
4. Weekly review: assess pace, swap in reserves if needed, adjust weekend ambition.
5. Day 30: loss ratio triangulator goes live — actuarial reserving capstone with deterministic IBNR outputs.
Bonus: challenge portfolio showcase remains available as an optional narrative artefact.
Definition of Done (per app)
Deliverable
Details
Working app
Professional UI (Next.js + React + Tailwind), end-to-end demoable in 2-3 minutes
API / backend
Next.js API routes with structured logging; tests passing
Database
Supabase schema (if needed) with idempotent init script; per-app naming
Deployed
Live on Vercel Hobby tier (or deployable with clear instructions)
GitHub repo
Clean structure, README.md (problem, idea, architecture, demo, tech stack)
Tests
Unit + integration test files; TDD approach; critical paths covered
Logging
Structured logging in API routes; app key in all messages
WORKFLOW.md
Machine-readable instructions for agents (Symphony / Claude Code)
Content
LinkedIn post + X post draft ready
 Generated 07 March 2026  |  30-Day Insurance AI Challenge  |  Poovi Rajendran  |  v4 Final — Best-of-three (ChatGPT + Perplexity +
 Claude)

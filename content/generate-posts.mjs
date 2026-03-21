import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentDir = path.join(root, 'content');
const postsDir = path.join(contentDir, 'posts');
fs.mkdirSync(postsDir, { recursive: true });
for (const file of fs.readdirSync(postsDir)) {
  if (file.endsWith('.html') || file.endsWith('.md')) {
    fs.unlinkSync(path.join(postsDir, file));
  }
}

const BUCKETS = [
  { rank: 1, name: "Lloyd's / Specialty Underwriting", priority: 'Highest', days: 8, pct: '27%' },
  { rank: 2, name: 'Exposure Management', priority: 'High', days: 4, pct: '13%' },
  { rank: 3, name: 'Claims Ops', priority: 'High', days: 4, pct: '13%' },
  { rank: 4, name: 'Broking / Placement', priority: 'Medium', days: 4, pct: '13%' },
  { rank: 5, name: 'Productivity & Automation', priority: 'Medium', days: 5, pct: '17%' },
  { rank: 6, name: 'Leadership / Team Ops', priority: 'Lower', days: 2, pct: '7%' },
  { rank: 7, name: 'General Insurance / Compliance', priority: 'Lower', days: 3, pct: '10%' }
];

function toUkEnglish(text) {
  if (!text) return text;
  return text
    .replace(/\boptimize\b/gi, (m) => (m[0] === 'O' ? 'Optimise' : 'optimise'))
    .replace(/\boptimized\b/gi, (m) => (m[0] === 'O' ? 'Optimised' : 'optimised'))
    .replace(/\boptimization\b/gi, (m) => (m[0] === 'O' ? 'Optimisation' : 'optimisation'))
    .replace(/\boptimizing\b/gi, (m) => (m[0] === 'O' ? 'Optimising' : 'optimising'))
    .replace(/\bcategorize\b/gi, (m) => (m[0] === 'C' ? 'Categorise' : 'categorise'))
    .replace(/\bstandardize\b/gi, (m) => (m[0] === 'S' ? 'Standardise' : 'standardise'))
    .replace(/\bstandardized\b/gi, (m) => (m[0] === 'S' ? 'Standardised' : 'standardised'))
    .replace(/\bstandardizing\b/gi, (m) => (m[0] === 'S' ? 'Standardising' : 'standardising'))
    .replace(/\bsummarize\b/gi, (m) => (m[0] === 'S' ? 'Summarise' : 'summarise'))
    .replace(/\banalyze\b/gi, (m) => (m[0] === 'A' ? 'Analyse' : 'analyse'))
    .replace(/\banalyzes\b/gi, (m) => (m[0] === 'A' ? 'Analyses' : 'analyses'))
    .replace(/\banalyzing\b/gi, (m) => (m[0] === 'A' ? 'Analysing' : 'analysing'))
    .replace(/\bnormalization\b/gi, (m) => (m[0] === 'N' ? 'Normalisation' : 'normalisation'))
    .replace(/\bbehavior\b/gi, (m) => (m[0] === 'B' ? 'Behaviour' : 'behaviour'));
}

const posts = [
  {
    id: 'P01',
    title: 'Why I\'m doing a 30-day insurance AI challenge',
    hooks: [
      'I\'m building 30 insurance AI apps in 30 days, end to end.',
      'Not concept slides. Production-style tools for underwriting, claims, and operations.'
    ],
    body: 'The goal is simple: ship small, useful products that solve real market problems and can be demoed in minutes. This challenge is designed to turn AI from a slide-deck topic into repeatable operating value across the London Market.',
    cta: 'Follow the series if you want the build notes and lessons as each app ships.',
    hashtags: ['#InsuranceAI','#LloydsMarket','#Underwriting','#ClaimsOps','#AIOps'],
    media: ['assets/diagrams/purpose-hero.png','assets/animations/flow-core.gif'],
    category: 'series'
  },
  {
    id: 'P02',
    title: 'How we are building it: the architecture behind the insurance AI monorepo',
    hooks: [
      'Every app starts with the same backbone: a shared platform, not a pile of one-off demos.',
      'The point is to make 30 apps feel like one system, with clear boundaries and reusable parts.'
    ],
    body: 'We\'re building this as a monorepo with shared packages, app-specific schemas, and a consistent layered architecture. Data flows in a straight line: upload or API request -> validation -> repository -> service logic -> AI helper where needed -> response -> structured logs -> persistence in Supabase. That structure keeps each app demoable in minutes and scalable in code quality.',
    cta: 'If you were reviewing this architecture, where would you pressure-test it first?',
    hashtags: ['#InsuranceAI','#SoftwareArchitecture','#NextJS','#Supabase','#AIOps'],
    media: ['assets/diagrams/architecture-business.png','assets/animations/flow-core.mp4','assets/logos/vercel.svg','assets/logos/supabase.svg','assets/logos/nextdotjs.svg','assets/logos/typescript.svg'],
    category: 'architecture'
  },
  {
    id: 'P03',
    title: 'How we are building it (the complete nerdy version)',
    hooks: [
      'This is the nerdy version: schemas, services, logs, AI routing, and test harnesses all wired together.',
      'If you care about maintainability, the data flow is the product.'
    ],
    body: 'A request enters a Next.js API route, gets validated, and is routed to a deterministic service. The service calls typed repositories, optionally invokes AI extract/classify/summarise helpers, writes to app-specific Supabase schemas, and emits structured audit stages. Every app has requestId + appKey logs and explicit persistence status semantics: stored, skipped, failed.',
    cta: 'Comment “nerdy” if you want a per-layer walkthrough with example route + schema contracts.',
    hashtags: ['#InsuranceAI','#AIEngineering','#DataFlow','#NextJS','#Supabase'],
    media: ['assets/diagrams/architecture-nerdy.png','assets/animations/flow-underwriting.mp4','assets/logos/github.svg','assets/logos/docker.svg','assets/logos/openai.svg'],
    category: 'architecture'
  },
  {
    id: 'P04',
    title: 'What is coming next: grouped roadmap by insurance workflow',
    hooks: [
      'The next phase is not random app shipping. It\'s grouped by problem space and operating rhythm.',
      'That way the series tells a coherent story instead of a scattered list of builds.'
    ],
    body: 'We are sequencing by business value and workflow adjacency. The spine stays the same (capture -> extract -> decide -> explain -> audit), while the domain shifts by bucket priority.\n\nBucket priorities:\n' + BUCKETS.map(b=>`${b.rank}. ${b.name} | ${b.priority} | ${b.days} days | ${b.pct}`).join('\n'),
    cta: 'Which bucket should we accelerate first for your team?',
    hashtags: ['#InsuranceAI','#ProductStrategy','#Roadmap','#Underwriting','#ClaimsOps'],
    media: ['assets/diagrams/roadmap-buckets.png','assets/animations/flow-claims.gif'],
    category: 'roadmap'
  },
  {
    id: 'P08', title: 'Day 0 plan: build once, scale 30 times',
    hooks: ['Day 0 is not for features.','It\'s for building the foundation that makes 29 future apps faster.'],
    body: 'The first step is a clean monorepo, shared packages, consistent testing, Supabase conventions, and a deployment pattern that works once and scales cleanly. That upfront work reduces friction and keeps quality consistent.',
    cta: 'If you are building at pace, start with the operating system, not the first feature.',
    hashtags: ['#ProductEngineering','#Monorepo','#NextJS','#Supabase','#AIOps'],
    media: ['assets/diagrams/day0-plan.png'],
    category: 'milestone'
  },
  {
    id: 'P09', title: 'Improvements done until Day 3',
    hooks: ['By Day 3, the value was no longer just in shipping.','It was in tightening the workflow around every build.'],
    body: 'The first few apps exposed important guardrails: clearer extraction gates, cleaner schema permissions, stronger deployment patterns, and better handoff discipline. Each improvement reduced repeated mistakes in the next app.',
    cta: 'Every day should improve the next day. What guardrail gave your team the highest leverage?',
    hashtags: ['#BuildInPublic','#InsuranceInnovation','#DeliveryExcellence','#Supabase','#NextJS'],
    media: ['assets/diagrams/day3-improvements.png','assets/screenshots/day1.png','assets/screenshots/day2.png','assets/screenshots/day3.png'],
    category: 'milestone'
  },
  {
    id: 'P10', title: 'Improvements done until Day 10',
    hooks: ['Ten days in, the stack had started to compound.','The apps were becoming more repeatable, more testable, and more useful.'],
    body: 'The workflow moved from isolated prototypes to a repeatable delivery system: deterministic scoring, audit trails, shared UI patterns, predeploy checks, and cleaner Vercel conventions. This turns speed into something sustainable.',
    cta: 'If you want speed without chaos, standardise the hard parts early.',
    hashtags: ['#DigitalTransformation','#EngineeringLeadership','#ClaimsAI','#Underwriting','#AIOps'],
    media: ['assets/diagrams/day10-improvements.png','assets/screenshots/day8.png','assets/screenshots/day9.png','assets/screenshots/day10.png'],
    category: 'milestone'
  },
  {
    id: 'P11', title: 'Overall lessons learnt until Day 10 and efficiency gains',
    hooks: ['The biggest lesson so far is simple.','Speed comes from standards, not shortcuts.'],
    body: 'Shared foundations, explicit rules, and reusable patterns reduced setup time and improved consistency across underwriting and claims workflows. Efficiency gains came from fewer avoidable decisions, cleaner handoffs, and faster debugging.',
    cta: 'I\'ll keep sharing what worked, what broke, and what we standardised next.',
    hashtags: ['#LessonsLearned','#OperatingModel','#InsuranceTechnology','#Productivity','#AI'],
    media: ['assets/diagrams/lessons-efficiency.png'],
    category: 'milestone'
  }
];

const dayPosts = [
  {
    id:'D01',day:1,app:'submission-triage-copilot',title:'From broker submission to triage decision in minutes',
    hooks:['Underwriters do not need more PDFs. They need a fast way to decide what deserves attention.','Day 1 turns messy broker submissions into a clear accept, refer, or decline recommendation.'],
    problem:'Submission packs arrive as inconsistent documents with missing fields and too much manual reading. That slows first-pass triage.',
    mvp:'Text-first intake that extracts key fields, scores appetite fit, returns a decision with reasoning, and stores results for auditability.',
    scale:'Multi-document ingestion, broker workspace integration, class-specific rule libraries, and human-in-the-loop borderline queues.',
    cta:'If you were building this for an underwriting team, what would you want surfaced first?',
    hashtags:['#InsuranceAI','#Underwriting','#LloydsMarket','#RiskSelection','#AIProduct']
  },
  {id:'D02',day:2,app:'portfolio-mix-dashboard',title:'Portfolio concentration risk should be visible before it becomes a loss',hooks:['Good portfolios fail quietly when concentration builds in the wrong place.','Day 2 makes mix, territory, and limit pressure visible before the next bind.'],problem:'Static spreadsheets hide accumulation and class/territory skew until someone spots the pattern late.',mvp:'CSV workflow that analyses mix, flags concentration warnings, and adds plain-English commentary.',scale:'Live monitoring, scenario overlays, threshold alerts, steering dashboards, syndicate governance reporting.',cta:'Would you use this as daily monitoring or pre-bind decision aid?',hashtags:['#PortfolioManagement','#InsuranceAnalytics','#UnderwritingOps','#RiskAccumulation','#DataViz']},
  {id:'D03',day:3,app:'risk-appetite-parser',title:'Risk appetite documents should be machine-readable',hooks:['Most appetite statements are written for humans, but triage needs structure.','Day 3 converts policy text into actionable underwriting rules.'],problem:'Appetite guidance buried in prose makes consistent decisions hard.',mvp:'Parser converts statements into structured classes, territories, limits, exclusions, with Q&A lookup.',scale:'Versioned appetite knowledge base with approvals, rule sync, and change tracking.',cta:'How do you manage appetite drift today: manually or with a rules layer?',hashtags:['#RiskAppetite','#Underwriting','#InsuranceTech','#LLM','#Governance']},
  {id:'D04',day:4,app:'slip-reviewer',title:'Lloyd\'s slips need a faster first read',hooks:['A slip can hide the issue in plain sight if every clause is manual.','Day 4 surfaces key terms, unusual clauses, and coverage gaps in one pass.'],problem:'Reviewers spend too much time extracting terms and too little on material clauses.',mvp:'Slip review flow extracts terms, flags unusual wording/gaps, and produces reviewer-ready output.',scale:'Clause library comparisons, benchmark wording checks, endorsement awareness, specialist routing.',cta:'What clause type should be auto-highlighted first in a real market review?',hashtags:['#Lloyds','#SlipReview','#InsuranceAI','#ClauseAnalysis','#Broking']},
  {id:'D05',day:5,app:'class-of-business-classifier',title:'Free-text risk descriptions should map to a clear class',hooks:['When class coding is wrong, everything downstream gets harder.','Day 5 maps unstructured risk text to class-of-business with confidence.'],problem:'Vague descriptions are hard to categorise consistently.',mvp:'Classifier returns top class + alternatives, explains signal mix, warns on low confidence.',scale:'Taxonomy normalisation, broker validation, DA checks, feedback loops for classifier quality.',cta:'Would you trust this as underwriter assistant or front-door validation?',hashtags:['#Classification','#UnderwritingOps','#InsuranceData','#DecisionSupport','#AIInInsurance']},
  {id:'D06',day:6,app:'exposure-accumulation-heatmap',title:'Accumulation risk is easier to manage when you can see it',hooks:['Spreadsheet totals do not reveal hotspots until they are crowded.','Day 6 turns location data into an accumulation heatmap with warnings.'],problem:'Teams need fast visibility of insured value clustering before crossing tolerance lines.',mvp:'CSV-driven heatmap validates locations, aggregates TIV, highlights hotspots, and adds commentary.',scale:'Multi-peril overlays, cat scenario layering, near-real-time surveillance.',cta:'What would make this production-ready first: validation, map fidelity, or scenarios?',hashtags:['#ExposureManagement','#AccumulationRisk','#GeoAnalytics','#InsuranceTech','#Heatmap']},
  {id:'D07',day:7,app:'cat-event-briefing',title:'Cat event updates should become action, not noise',hooks:['When an event breaks, teams need a briefing that says what changed and what to do.','Day 7 turns catastrophe bulletins into impact summaries and actions.'],problem:'Dense bulletins slow understanding of impacted classes and likely loss bands.',mvp:'Tool classifies event, estimates severity, identifies impacted classes, outputs concise actions.',scale:'Multi-feed ingestion, timeline tracking, exposure overlays, escalation workflows.',cta:'Should cat briefing optimise for speed, depth, or strict one-page operations?',hashtags:['#CatRisk','#ExposureManagement','#InsuranceAnalytics','#EventBriefing','#RiskOps']},
  {id:'D08',day:8,app:'policy-endorsement-diff-checker',title:'Endorsement changes can hide material risk',hooks:['A renewal can look familiar until one clause changes the story.','Day 8 compares expiring vs renewal wording to surface material differences fast.'],problem:'Manual endorsement comparison misses subtle but material wording shifts.',mvp:'Diff checker flags material changes by severity with executive brief and audit trail.',scale:'Wording intelligence, clause libraries, benchmark comparisons, specialist referral routing.',cta:'Where would this save most time: underwriting, broking, or claims review?',hashtags:['#PolicyWordings','#Renewals','#InsuranceAI','#ClauseDiff','#RiskReview']},
  {id:'D09',day:9,app:'referral-priority-queue-scorer',title:'Referral queues need ranking, not just backlog',hooks:['Not every referral deserves the same urgency.','Day 9 scores the queue so reviewers work highest-risk items first.'],problem:'Without consistent ranking, queues are driven by inbox order not risk/urgency.',mvp:'TSV scorer ranks referrals with weighted factors, critical warnings, and persisted analysis.',scale:'Live queue orchestration, SLA tracking, team routing, capacity balancing.',cta:'Would you replace queue order or use it as reviewer guidance first?',hashtags:['#WorkflowAutomation','#UnderwritingReferral','#InsuranceOps','#Prioritization','#DecisionIntelligence']},
  {id:'D10',day:10,app:'claims-fnol-triage-assistant',title:'FNOL triage should start with a decision, not an inbox',hooks:['The first notice of loss is where speed matters most.','Day 10 classifies FNOLs into fast-track, manual-review, or escalate with factor-level reasoning.'],problem:'FNOL emails are messy and routing is inconsistent.',mvp:'Deterministic FNOL triage with reasoning factors and audit-friendly persistence.',scale:'Inbox integrations, guided chat intake, policy lookups, fraud/severity signals, auto-routing.',cta:'If you could automate one handoff tomorrow, which one is it?',hashtags:['#ClaimsOps','#FNOL','#InsuranceAI','#ClaimsTriage','#Automation']}
];

const sectionPosts = [
  ['P20','start','Lloyd\'s/Specialty Underwriting','Specialty underwriting wins before the quote is written.','The best teams make complexity look controlled.','In Lloyd\'s and specialty markets, edge comes from disciplined appetite, clear referral paths, and fast context.'],
  ['P21','start','Exposure Management','Exposure management is where assumptions get tested.','If you cannot see it, you cannot control it.','Exposure management is the control tower for accumulation, concentration, and steering decisions.'],
  ['P22','start','Claims Ops','Claims operations shape trust at the moment it matters most.','Speed matters. So does consistency.','Claims teams protect retention, brand, and capital through timely, documented, defensible decisions.'],
  ['P23','start','Broking / Placement','Placement is part market strategy, part execution discipline.','The right submission still needs the right market path.','Broking teams win by combining market knowledge with clean execution and sharper narratives.'],
  ['P24','start','Productivity & Automation','Productivity gains come from removing friction, not adding dashboards.','Automation should free time for judgment work.','Best automation removes repetitive handoffs and improves data quality at intake.'],
  ['P25','start','Leadership / Team Ops','Team performance is built in the operating rhythm.','Leadership is mostly systems, not slogans.','High-performing teams share explicit priorities, visible ownership, and clear operating cadence.'],
  ['P26','start','General Insurance / Compliance','Compliance is not a side constraint. It is part of the product.','Best controls reduce risk without slowing business.','Governance works best when designed into daily workflows, not bolted on after.'],
  ['P27','wrap','Lloyd\'s/Specialty Underwriting','Strong specialty underwriting is built on repeatable judgment.','That only works when process supports people.','Best-performing teams balance appetite, speed, and consistency with clear control boundaries.'],
  ['P28','wrap','Exposure Management','Exposure management turns uncertainty into action.','Goal is not perfect data. Goal is better decisions.','Shared accumulation visibility helps leaders decide earlier and avoid surprises later.'],
  ['P29','wrap','Claims Ops','Claims operations are where process meets promise.','If the model is weak, customers feel it immediately.','Fast, consistent handling depends on ownership, documentation, and escalation clarity.'],
  ['P30','wrap','Broking / Placement','Placement is won in details before market sees the risk.','Better preparation improves both speed and outcomes.','Operational discipline plus market intelligence drives better placement execution.'],
  ['P31','wrap','Productivity & Automation','Automation should create capacity, not convenience.','Right systems make good habits easier to keep.','The biggest gains come from removing low-value manual work and standardising frequent rework points.'],
  ['P32','wrap','Leadership / Team Ops','Leadership is visible in team behaviour when no one is watching.','Consistency beats intensity over the long run.','Performance improves when priorities are explicit and accountability is routine.'],
  ['P33','wrap','General Insurance / Compliance','Compliance works best when built into work.','Rules alone do not reduce risk. Good design does.','Practical and proportionate controls reduce friction while strengthening assurance.']
].map(([id,type,section,h1,h2,body]) => {
  const startCtas = {
    "Lloyd's/Specialty Underwriting": 'Where does your underwriting flow lose the most time today: intake, appetite checks, or referrals?',
    'Exposure Management': 'Where is your biggest blind spot today: concentration by geography, class, or limit size?',
    'Claims Ops': 'What is the first claims handoff you would automate without reducing control?',
    'Broking / Placement': 'Where do placements stall most for your team: market mapping, wording quality, or referral loops?',
    'Productivity & Automation': 'Which repetitive task should be removed first to release frontline capacity?',
    'Leadership / Team Ops': 'Which operating rhythm would improve outcomes fastest: clearer priorities, better handovers, or tighter feedback loops?',
    'General Insurance / Compliance': 'Which control is currently the most manual and could be designed into workflow?'
  };
  const wrapCtas = {
    "Lloyd's/Specialty Underwriting": 'If you improved one lever this quarter, would it be appetite clarity, referral speed, or wording quality?',
    'Exposure Management': 'Which metric should drive weekly action first: top hotspots, accumulation trend, or tail exposure?',
    'Claims Ops': 'What should be your lead KPI here: cycle time, leakage reduction, or consistency of triage outcomes?',
    'Broking / Placement': 'What would lift placement outcomes more right now: better risk narratives or cleaner market execution?',
    'Productivity & Automation': 'Which workflow should be standardised next to remove avoidable rework?',
    'Leadership / Team Ops': 'What one operating change would raise team consistency over the next 90 days?',
    'General Insurance / Compliance': 'How would you simplify assurance while keeping controls proportionate and effective?'
  };
  return {
  id,title:`${section} - Section ${type==='start'?'Start':'Wrap'}`,
  hooks:[h1,h2],
  body,
  cta: type==='start' ? startCtas[section] : wrapCtas[section],
  hashtags:
    section.includes('Underwriting') ? ['#Insurance','#LloydsMarket','#Underwriting','#InsuranceAI','#AIOps'] :
    section.includes('Claims') ? ['#Insurance','#ClaimsOps','#Claims','#InsuranceAI','#AIOps'] :
    section.includes('Exposure') ? ['#Insurance','#ExposureManagement','#AccumulationRisk','#InsuranceAnalytics','#AIOps'] :
    section.includes('Broking') ? ['#Insurance','#Broking','#Placement','#InsuranceAI','#AIOps'] :
    section.includes('Productivity') ? ['#Insurance','#Productivity','#Automation','#AIOps','#InsuranceTechnology'] :
    section.includes('Leadership') ? ['#Insurance','#Leadership','#TeamOps','#OperatingModel','#AIOps'] :
    ['#Insurance','#Compliance','#Governance','#RegulatoryCompliance','#AIOps'],
  media:[
    section.includes('Underwriting') ? 'assets/diagrams/section-underwriting.png' :
    section.includes('Claims') ? 'assets/diagrams/section-claims.png' :
    section.includes('Exposure') ? 'assets/diagrams/section-exposure.png' :
    'assets/diagrams/section-operations.png'
  ],
  category:'section'
  };
});

for (const d of dayPosts) {
  const hooks = d.hooks.map(toUkEnglish);
  const title = toUkEnglish(d.title);
  const body = toUkEnglish(`Problem: ${d.problem}\n\nMVP achieved: ${d.mvp}\n\nScale path: ${d.scale}`);
  const cta = toUkEnglish(d.cta);
  posts.push({
    id:d.id,
    title:`Day ${d.day}: ${title}`,
    hooks,
    body,
    cta,
    hashtags:d.hashtags,
    media:[`assets/screenshots/day${d.day}.png`,`assets/app-logos/day${d.day}.svg`],
    category:'day-app',
    day:d.day,
    app:d.app
  });
}

posts.push(...sectionPosts);

for (const p of posts) {
  p.title = toUkEnglish(p.title);
  p.hooks = (p.hooks || []).map(toUkEnglish);
  p.body = toUkEnglish(p.body);
  p.cta = toUkEnglish(p.cta);
  if (Array.isArray(p.hashtags) && p.hashtags.length > 5) p.hashtags = p.hashtags.slice(0, 5);
}

const postById = Object.fromEntries(posts.map(p=>[p.id,p]));

function esc(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function linkMedia(media){
  return media.map((m)=>{
    if (m.endsWith('.mp4')) return `<video controls muted loop playsinline class="media"><source src="../${m}" type="video/mp4"></video>`;
    return `<img class="media" src="../${m}" alt="${esc(path.basename(m))}">`;
  }).join('\n');
}

const css = `
:root{--bg:#eef4f6;--ink:#0f172a;--muted:#475569;--accent:#0f766e;--card:#ffffff;}
*{box-sizing:border-box} body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:var(--bg);color:var(--ink)}
.wrap{max-width:1100px;margin:0 auto;padding:24px}
.card{background:var(--card);border:1px solid #d7e1e7;border-radius:18px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
.hooks{font-size:1.35rem;line-height:1.25;font-weight:700;margin:0 0 8px;color:#0b1730}
.hooks2{font-size:1.15rem;line-height:1.35;font-weight:700;color:#0b1730;margin:0 0 18px}
.meta{color:var(--muted);font-size:.95rem;margin-bottom:8px}
.body{white-space:pre-wrap;line-height:1.6;color:#1f2937}
.cta{margin-top:14px;font-weight:600;color:var(--accent)}
.tags{margin-top:10px;color:#0f172a;font-size:.95rem}
.media-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:16px}
.media{width:100%;border:1px solid #d6e0e8;border-radius:12px;background:#fff}
.topnav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.topnav a{padding:7px 10px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;text-decoration:none;font-size:.9rem}
.table{width:100%;border-collapse:collapse;margin-top:14px}.table th,.table td{border:1px solid #d7e1e7;padding:8px;text-align:left}
.disclaimer{margin-top:24px;font-size:.82rem;color:#64748b}
`; 

const order = [
  'P01','P02','P03','P04','P08','P09','P10','P11',
  'P20','P21','P22','P23','P24','P25','P26',
  'D01','D02','D03','D04','D05','D06','D07','D08','D09','D10',
  'P27','P28','P29','P30','P31','P32','P33'
];

const cards = [];
for (const id of order) {
  const p = postById[id];
  if (!p) continue;
  const filename = `${p.id.toLowerCase()}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}.html`;
  p.file = filename;

  const extra = p.id === 'P04'
    ? `<table class="table"><thead><tr><th>Bucket</th><th>Priority</th><th>Days</th><th>%</th></tr></thead><tbody>${BUCKETS.map(b=>`<tr><td>${esc(b.name)}</td><td>${esc(b.priority)}</td><td>${b.days}</td><td>${b.pct}</td></tr>`).join('')}</tbody></table>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.id)} - ${esc(p.title)}</title><style>${css}</style></head><body><div class="wrap"><div class="topnav"><a href="../index.html">← Master Index</a></div><article class="card"><div class="meta">${esc(p.id)}${p.day?` • Day ${p.day}`:''}${p.app?` • ${esc(p.app)}`:''} • ${esc(p.category||'post')}</div><h1>${esc(p.title)}</h1><p class="hooks">${esc(p.hooks[0])}</p><p class="hooks2">${esc(p.hooks[1])}</p><div class="body">${esc(p.body)}</div>${extra}<div class="cta">${esc(p.cta)}</div><div class="tags">${p.hashtags.map(esc).join(' ')}</div><div class="media-grid">${linkMedia(p.media||[])}</div><p class="disclaimer">Disclaimer: Product names, logos, and trademarks are the property of their respective owners and are used for editorial/demo context.</p></article></div></body></html>`;
  fs.writeFileSync(path.join(postsDir, filename), html);

  const md = `# ${p.id} - ${p.title}\n\n${p.hooks[0]}\n${p.hooks[1]}\n\n${p.body}\n\nCTA: ${p.cta}\n\nHashtags: ${p.hashtags.join(' ')}\n\nMedia:\n${(p.media||[]).map(m=>`- ${m}`).join('\n')}\n`;
  fs.writeFileSync(path.join(postsDir, filename.replace(/\.html$/,'.md')), md);

  cards.push(`<a class="card" href="posts/${filename}" style="display:block;text-decoration:none;color:inherit"><div class="meta">${p.id} • ${esc(p.category||'post')}</div><h3 style="margin:8px 0 10px">${esc(p.title)}</h3><p class="hooks" style="font-size:1.05rem;margin:0">${esc(p.hooks[0])}</p><p style="margin-top:10px;color:#475569">${esc(p.hooks[1])}</p></a>`);
}

const index = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LinkedIn Post Pack - 30 Day Challenge</title><style>${css} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}</style></head><body><div class="wrap"><section class="card" style="margin-bottom:14px"><h1>LinkedIn Content Pack - 30 Day Insurance AI Challenge</h1><p class="body">Total posts: ${cards.length}. Includes architecture/business/nerdy posts, roadmap posts, Day 1-10 app posts, section start/wrap posts, and milestone retrospectives.</p><div class="media-grid"><img class="media" src="assets/diagrams/purpose-hero.png" alt="purpose"><img class="media" src="assets/diagrams/architecture-business.png" alt="arch"><img class="media" src="assets/diagrams/roadmap-buckets.png" alt="roadmap"></div><p class="disclaimer">Disclaimer: Product names, logos, and trademarks are the property of their respective owners and are used for editorial/demo context.</p></section><div class="grid">${cards.join('\n')}</div></div></body></html>`;
fs.writeFileSync(path.join(contentDir,'index.html'), index);
fs.writeFileSync(path.join(contentDir,'posts.json'), JSON.stringify(order.map(id=>postById[id]).filter(Boolean), null, 2));
console.log(`generated ${cards.length} posts`);

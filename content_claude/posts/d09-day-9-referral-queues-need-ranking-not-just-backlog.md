# D09 — Day 9: Your Referral Queue Is Lying to You About Priority

"Work the queue in order."

That is how most referral processes function in practice. Items arrive, they stack up, reviewers pull from the top. First-in, first-out.

The problem: a $500K professional indemnity referral with clean documentation gets the same queue position as a $15M construction liability referral with three coverage flags and a broker deadline in two hours.

FIFO is fair. It is also wrong.

**What I built (Day 9):**
A referral priority queue scorer. Upload referral data as TSV (tab-separated values — the format most queue exports produce). The tool scores each referral across weighted factors: risk size, complexity flags, time sensitivity, and authority level required.

Each referral gets a priority score from 0-100, a priority tier (Critical, High, Medium, Low), and a breakdown of which factors drove the ranking. Critical warnings surface separately — "Broker deadline within 4 hours" or "Limit exceeds individual authority" — so reviewers can act immediately.

The queue is re-ordered by priority, not arrival time.

**Why weighted scoring beats simple rules:**
A rules-based system says "anything over $10M is high priority." But a $12M renewal with clean history and no changes is lower urgency than a $3M new business with unusual territory exposure and an expiring broker deadline.

The weighted model considers multiple factors simultaneously and produces a score that reflects operational reality, not just one dimension.

**The design tension:**
Should this tool replace the queue order or advise the reviewer? I deliberately built it as guidance, not automation. The reviewer sees the scored queue and makes the call. The tool surfaces what matters. The human decides what happens.

This distinction matters in insurance. Referrals exist because a risk exceeded someone's authority. The response should enhance judgment, not bypass it.

**Technical details:**
- TSV intake with flexible column mapping
- Configurable scoring weights per factor
- Critical warning detection with separate flagging
- Persisted analysis with ranked output
- Schema: `app_referralqueue` with audit trail

---

**CTA:** Would you replace queue order entirely or use scored priority as reviewer guidance? I think the right answer depends on your team's maturity with AI-assisted decisions.

**Hashtags:** #WorkflowAutomation #UnderwritingReferral #InsuranceOps #Prioritisation #DecisionIntelligence #AIOps

**Image prompt (Gemini):** Dark navy background. Centre: a ranked queue showing 5 referral items — top item glowing red with "CRITICAL" badge and score 94, second item amber at 78, remaining items in teal/grey at lower scores. Each item shows insured name, limit, and key flag. Right side: a factor breakdown radar chart for the selected item. Top-left: "Day 9" teal badge. Bottom: "Referral Priority Queue Scorer". 1200x628.

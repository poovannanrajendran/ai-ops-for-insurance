# D02 — Day 2: Portfolio Concentration Should Be Visible Before It Becomes a Loss

Good portfolios fail quietly.

Concentration builds in the wrong class, the wrong territory, or the wrong limit band — and nobody notices until the loss event reveals the pattern. By then, the conversation has moved from "portfolio steering" to "loss review."

I have seen this happen more than once in my career across Lloyd's and specialty markets. The data was there. The visibility was not.

**The problem:**
Most portfolio views are static spreadsheets updated monthly. They show totals, not trends. Accumulation by territory or class hides in pivot tables that nobody refreshes until someone asks the awkward question in a board meeting.

Underwriting managers need to see concentration pressure before the next bind — not after the next renewal cycle.

**What I built (Day 2):**
A portfolio mix dashboard. Upload a CSV of your book. The tool analyses class distribution, territory concentration, limit bands, and flags warnings where accumulation crosses configurable thresholds.

But the real value is the commentary. Not just "Property is 43% of your book" — but "Property concentration in US Southeast has increased 12% this quarter and now exceeds your stated tolerance of 35%. Three recent binds contributed most of the shift."

Plain-English narrative alongside the numbers. Because dashboards without interpretation are just prettier spreadsheets.

**Technical decisions:**
- CSV intake with flexible column mapping (insurance data is never clean)
- Concentration scoring with configurable thresholds per class and territory
- Natural-language commentary generated from the numerical analysis
- Full persistence in `app_portfoliomix` schema with audit trail

**The scale path:**
Live monitoring connected to binding authority feeds. Scenario overlays ("what if we write this risk — how does it change our concentration profile?"). Threshold alerts to underwriting managers. Syndicate governance reporting.

Built with Claude Code. Deployed on Vercel. Live.

---

**CTA:** Would you use this as a daily monitoring tool or a pre-bind decision aid? I think the answer changes the design significantly.

**Hashtags:** #PortfolioManagement #InsuranceAnalytics #UnderwritingOps #RiskAccumulation #DataVisualization #LloydsMarket #AIOps

**Image prompt (Gemini):** Dashboard mockup on dark navy. Centre: a horizontal bar chart showing class-of-business distribution with one bar highlighted in amber (over-concentrated). Right side: a territory heat indicator showing US, UK, EU with traffic-light colours. Below: a text card with AI-generated commentary in white text. Top-left: "Day 2" teal badge. Bottom: "Portfolio Mix Dashboard". Clean, data-rich but not cluttered. 1200x628.

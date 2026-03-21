# D05 — Day 5: When the Class Code Is Wrong, Everything Downstream Breaks

"Professional indemnity for a software consultancy providing AI advisory services to financial institutions."

What class of business is that? PI? Technology E&O? Financial institutions? Cyber-adjacent?

An experienced underwriter resolves this in seconds. But the system that receives the submission needs a class code. And if the class code is wrong, the portfolio view is wrong, the appetite check is wrong, and the MI report is misleading.

Class coding is one of those invisible foundation problems. Nobody talks about it until the data quality audit.

**What I built (Day 5):**
A class-of-business classifier. Enter a free-text risk description. The tool returns the top class recommendation with confidence score, alternative classes ranked by likelihood, and an explanation of which signals drove the classification.

Critically, it warns when confidence is low. "This description matches PI at 62% and Technology E&O at 54% — consider manual review" is more useful than a silent wrong answer.

**Why this matters beyond data entry:**
In the London Market, class coding feeds into everything: portfolio MI, regulatory reporting (Lloyd's performance management), appetite scoring, and peer analysis. A systematic classifier that explains its reasoning creates a feedback loop — underwriters can validate or correct, improving the training signal over time.

This connects directly to Day 1 (submission triage) and Day 3 (risk appetite parser). When class coding is reliable, triage becomes sharper and appetite checks become meaningful.

**Technical details:**
- Classification with confidence scoring and multi-class ranking
- Signal explanation showing which terms drove the decision
- Low-confidence flagging with manual review recommendation
- Schema: `app_classofbusiness` with full audit trail
- Live at class-of-business-classifier.vercel.app

**The scale path:**
Taxonomy normalisation across Lloyd's classes. Broker validation at point of submission. DA checks for class consistency. Feedback loops where underwriter corrections improve classifier accuracy.

---

**CTA:** Would you trust this as an underwriter assistant or a front-door validation gate? The answer shapes how you design the confidence thresholds.

**Hashtags:** #Classification #UnderwritingOps #InsuranceData #DataQuality #LloydsMarket #AIInInsurance #DecisionSupport

**Image prompt (Gemini):** Clean classification UI on dark navy. Centre: a text input showing a risk description, with an arrow pointing to a results card showing "PI — Professional Indemnity" at 87% confidence in teal, with two alternative classes below at lower percentages in grey. A signal breakdown showing key terms highlighted. Top-left: "Day 5" teal badge. Bottom: "Class of Business Classifier". 1200x628.

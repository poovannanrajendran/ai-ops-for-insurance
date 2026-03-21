# D10 — Day 10: The First Notice of Loss Is Where Speed and Accuracy Collide

A claims handler opens their inbox on Monday morning. Fourteen new FNOLs.

Three are straightforward attritional claims — small value, clear coverage, standard process. Two are potentially complex — large loss indicators, possible coverage issues, multi-party involvement. The rest sit somewhere in between.

Without triage, all fourteen get the same treatment: read, assess, allocate. In order. By the time the complex claims get attention, the golden hour for early investigation has passed.

**The problem:**
FNOL emails are messy. They arrive in different formats from different sources — brokers, insureds, third parties, loss adjusters. Key information is scattered across free text. Classification depends on reading between the lines.

Manual routing is inconsistent. What one handler escalates, another processes normally. There is no shared definition of "this needs urgent attention" beyond individual experience.

**What I built (Day 10):**
A claims FNOL triage assistant with dual-mode intake. Paste an FNOL email or notification, or walk through a guided chat intake for structured data capture.

The tool extracts claim details — claimant, policy reference, loss type, date of loss, estimated value, coverage indicators — and classifies the FNOL into three triage paths:

- **Fast-track:** Low complexity, clear coverage, standard process
- **Manual review:** Moderate complexity, potential coverage questions
- **Escalate:** High severity, coverage disputes, fraud indicators, regulatory triggers

Each classification comes with factor-level reasoning. Not just "escalate" — but "escalate because: estimated value exceeds $1M, loss description indicates potential third-party liability, and coverage territory flagged for sanctions screening."

**The dual-mode design:**
Day 10 in the roadmap originally focused on email parsing. But the conversational intake angle — walking a broker or insured through a structured FNOL submission via guided questions — was too valuable to ignore.

So I built both. Same triage engine, two front doors. The handler can paste raw email text or guide a caller through the intake. Both paths produce the same structured output.

**Technical details:**
- Deterministic triage scoring with configurable factor weights
- Reasoning factors surfaced for every decision
- Guided chat intake with progressive field capture
- Full persistence in `app_claimsfnol` with audit stages
- Processing time tracked and returned in response

---

**CTA:** If you could automate one claims handoff tomorrow without reducing control, which one would it be?

**Hashtags:** #ClaimsOps #FNOL #InsuranceAI #ClaimsTriage #Automation #LloydsMarket #InsuranceClaims

**Image prompt (Gemini):** Dark navy background. Centre: split view showing two intake modes — left: an email text panel with key fields highlighted, right: a guided chat interface with progressive questions. Below both: a triage result card showing "ESCALATE" in red with three reasoning factors listed. Top-left: "Day 10" teal badge. Bottom: "Claims FNOL Triage Assistant". Professional claims-ops aesthetic. 1200x628.

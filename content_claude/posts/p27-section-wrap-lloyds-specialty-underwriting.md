# P27 — Section Wrap: Five Underwriting Tools — What I Learned

Five tools. Five underwriting bottlenecks. One week.

Here is what building the underwriting suite taught me:

**The hardest problems are not technical.**
Extracting fields from a slip is an AI task. Defining what "appetite fit" means in a configurable, syndicate-specific way? That is a domain problem. Every tool in this section worked technically within hours. Getting the domain logic right took the rest of the time.

**Underwriters do not want AI decisions. They want AI preparation.**
Every tool I built returns recommendations with reasoning, not final answers. "Refer — because limit exceeds appetite by 20% and territory is outside core book" is useful. "Refer" alone is not. The reasoning is the product.

**The tools connect to each other.**
Day 1 (submission triage) uses Day 3's appetite parser logic. Day 5's class coding feeds Day 2's portfolio view. This was not planned from Day 1 — it emerged as I understood the domain better. The monorepo made these connections cheap to build.

**Lloyd's reform creates the demand.**
Blueprint Two, CDR modernisation, and the push towards structured data submission make tools like these more valuable, not less. The market is moving towards machine-readable workflows. These tools demonstrate what that looks like in practice.

Five apps is a small start. But it covers the core underwriting loop: intake → appetite → review → classify → monitor.

The next section moves into claims and exposure. Different workflow, same principle: compress the gap between information and action.

---

**CTA:** If you improved one lever in underwriting this quarter, would it be appetite clarity, triage speed, or portfolio visibility?

**Hashtags:** #LloydsMarket #Underwriting #InsuranceAI #SpecialtyInsurance #AIOps #BuildInPublic

**Image prompt (Gemini):** Dark navy background. Centre: five completed checkmark icons in a horizontal line, each labelled with the tool name below. A subtle connecting line shows the data flow between them. Title: "Underwriting Core — Complete." Below: "5 tools. 5 bottlenecks. 1 week." Teal accents. 1200x628.

import { describe, expect, it } from "vitest";

import { analyzeMeetingPrep } from "@/services/analyze-meeting-prep";

const balancedBriefing = `CLIENT: Northbridge Food Ingredients Ltd
MEETING DATE: 2026-04-14
BROKER: Aegis Specialty Partners
LINE OF BUSINESS: Products Liability / Property Combined
UNDERWRITER: London Property & Liability Team
OBJECTIVE: Renewal terms discussion and capacity confirmation for combined programme
PREMIUM: £380,000 prior year; proposed movement +6% reflecting inflationary exposure uplift
LOSS RATIO: 42% five-year average; nil claims in current year
LIMIT: £25,000,000 any one occurrence; £50,000,000 aggregate
DEDUCTIBLE: £100,000 own damage; £250,000 products liability
POSITIVES: No material claims in five years
RISKS: One unresolved product recall matter in active defence; dependency on two key suppliers
OPEN ITEMS: Confirm supply-chain testing cadence; validate deductible preference; obtain updated EML survey report
STAKEHOLDERS: CFO, Risk Manager, Broking Lead, Claims Advocate
DECISION DEADLINE: 2026-04-25
MARKET CONDITIONS: Stable to slightly hardening for food sector`;

const referralBriefing = `CLIENT: Atlas Maritime Logistics
MEETING DATE: 2026-04-09
BROKER: Harbour Placement LLP
LINE OF BUSINESS: Marine Cargo — Open Cover
UNDERWRITER: Marine Cargo Referral Desk
OBJECTIVE: Mid-term review after sanctions route disruption and cargo theft cluster
PREMIUM: £1,200,000 annualised
LOSS RATIO: 87% current year; adverse claims development
LIMIT: USD 15,000,000 any one sending; EML under review pending updated voyage routing
DEDUCTIBLE: USD 50,000 per occurrence
RISKS: sanctions route disruption; exceed authority EML profile
OPEN ITEMS: Confirm sanctions control ownership; obtain signed compliance attestation; agree interim capacity guardrails
STAKEHOLDERS: COO, Compliance Lead, Broking Director, Claims Counsel
DECISION DEADLINE: 2026-04-11
MARKET CONDITIONS: Hardening; capacity tightening`;

const declineBriefing = `CLIENT: Crisis Freight plc
MEETING DATE: 2026-04-10
OBJECTIVE: Emergency terms review
RISKS: sanctions exposure unresolved; fraud allegation in adjudication; breach of declarations with bordereau overdue; urgent escalation required
OPEN ITEMS: confirm legal stance; validate recovery path; produce external counsel letter
STAKEHOLDERS: CUO, Compliance, Claims Director
DECISION DEADLINE: 2026-04-11`;

describe("analyzeMeetingPrep", () => {
  it("builds deterministic meeting pack outputs", () => {
    const result = analyzeMeetingPrep(balancedBriefing, "What should we cover first in agenda?");

    expect(result.missing.length).toBe(0);
    expect(result.insight.summary.stakeholdersMentioned).toBeGreaterThan(1);
    expect(result.insight.talkingPoints.length).toBe(6);
    expect(result.insight.whitespaceRows.length).toBe(10);
    expect(result.insight.agenda.length).toBeGreaterThanOrEqual(4);
    expect(result.insight.marketContext).toBe("hardening");
    expect(result.insight.uwPosition.position).toBe("refer");
    expect(result.insight.whitespaceRows.some((row) => row.fieldWording === "Client")).toBe(true);
  });

  it("returns missing required field list for incomplete input", () => {
    const result = analyzeMeetingPrep(`CLIENT: Short Note Co\nOBJECTIVE: Quick discussion\nRISKS:\nOPEN ITEMS:`);

    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.insight.warnings.some((warning) => warning.includes("Missing required briefing fields"))).toBe(true);
  });

  it("derives underwriter position states deterministically", () => {
    const refer = analyzeMeetingPrep(referralBriefing);
    expect(refer.insight.uwPosition.position).toBe("refer");

    const decline = analyzeMeetingPrep(declineBriefing);
    expect(decline.insight.uwPosition.position).toBe("decline");

    const negotiate = analyzeMeetingPrep(
      `CLIENT: Example Ltd\nMEETING DATE: 2026-04-10\nOBJECTIVE: renewal\nRISKS: unresolved deductible change\nOPEN ITEMS: clarify deductible; confirm wording; validate timeline\nSTAKEHOLDERS: Underwriter`
    );
    expect(negotiate.insight.uwPosition.position).toBe("negotiate");

    const hold = analyzeMeetingPrep(
      `CLIENT: Stable Co\nMEETING DATE: 2026-04-10\nOBJECTIVE: renewal meeting\nRISKS: low operational updates\nOPEN ITEMS: confirm minutes\nSTAKEHOLDERS: Underwriter`
    );
    expect(hold.insight.uwPosition.position).toBe("hold");
  });

  it("derives market context variants", () => {
    const base = balancedBriefing.replace(/MARKET CONDITIONS:.+/g, "");
    expect(analyzeMeetingPrep(`${base}\nMARKET CONDITIONS: hardening trend`).insight.marketContext).toBe("hardening");
    expect(analyzeMeetingPrep(`${base}\nMARKET CONDITIONS: softening cycle`).insight.marketContext).toBe("softening");
    expect(analyzeMeetingPrep(`${base}\nMARKET CONDITIONS: stable outlook`).insight.marketContext).toBe("stable");
    expect(analyzeMeetingPrep(base).insight.marketContext).toBe("unknown");
  });

  it("builds agenda with conditional sections", () => {
    const result = analyzeMeetingPrep(referralBriefing);
    const agendaItems = result.insight.agenda.map((item) => item.item);
    expect(agendaItems).toContain("Claims and loss history");
    expect(agendaItems).toContain("Risk cue review");
    expect(agendaItems).toContain("Open items resolution");
    expect(agendaItems).toContain("Capacity and limit position");
    expect(result.insight.agenda[0]?.order).toBe(1);
    expect(result.insight.agenda.at(-1)?.item).toBe("Decision and next steps");
  });
});

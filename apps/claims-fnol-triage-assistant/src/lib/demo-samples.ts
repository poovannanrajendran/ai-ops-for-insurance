export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  fnolText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "fast-track-water",
    label: "Fast-track water loss",
    description: "Low-severity property FNOL with complete data and no injury or fraud markers.",
    sourceLabel: "fast-track-water-loss.txt",
    question: "Why is this suitable for fast-track handling?",
    fnolText: `Claim Reference: FNOL-24018
Insured Name: Westbridge Apartments Ltd
Class of Business: Property
Loss Date: 2026-03-19
Reported Date: 2026-03-20
Location: Manchester, United Kingdom
Cause of Loss: Minor escape of water from a kitchen pipe
Estimated Reserve: GBP 7,500
Currency: GBP
Injury Count: 0
Third Party Injury: no
Fatality Indicator: no
Police Report: no
Fraud Indicator: no
Claimant Represented: no
Litigation Indicator: no
Property Damage Severity: minor
Business Interruption Days: 0
Notes: Two flats affected. Photos received and contractor attendance booked.`
  },
  {
    id: "manual-review-theft",
    label: "Manual review theft",
    description: "Moderate reserve and incomplete police evidence requiring handler review.",
    sourceLabel: "manual-review-theft.txt",
    question: "What keeps this out of fast-track treatment?",
    fnolText: `Claim Reference: FNOL-24044
Insured Name: Norchester Retail Group
Class of Business: Property
Loss Date: 2026-03-18
Reported Date: 2026-03-20
Location: Birmingham, United Kingdom
Cause of Loss: Overnight theft and forced entry to insured premises
Estimated Reserve: GBP 42,000
Currency: GBP
Injury Count: 0
Third Party Injury: no
Fatality Indicator: no
Police Report: no
Fraud Indicator: no
Claimant Represented: no
Litigation Indicator: no
Property Damage Severity: moderate
Business Interruption Days: 6
Notes: Stock list still pending and CCTV copy not yet received.`
  },
  {
    id: "escalate-bodily-injury",
    label: "Escalate bodily injury",
    description: "Casualty FNOL with third-party injury, legal representation, and high reserve pressure.",
    sourceLabel: "escalate-bodily-injury.txt",
    question: "Which factors make this an escalation case?",
    fnolText: `Claim Reference: FNOL-24102
Insured Name: Arrowline Logistics Ltd
Class of Business: Motor Fleet
Loss Date: 2026-03-17
Reported Date: 2026-03-20
Location: M25 Junction 10, United Kingdom
Cause of Loss: Multi vehicle collision with bodily injury and road closure
Estimated Reserve: GBP 325,000
Currency: GBP
Injury Count: 2
Third Party Injury: yes
Fatality Indicator: no
Police Report: yes
Fraud Indicator: no
Claimant Represented: yes
Litigation Indicator: yes
Property Damage Severity: severe
Business Interruption Days: 12
Notes: Claimant solicitor has written to insured. External counsel and senior casualty oversight requested.`
  }
];

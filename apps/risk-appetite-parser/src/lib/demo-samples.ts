export const multilineStatementSample = `Insured Name: Helios Engineering Group
Class of Business: Property, Marine Cargo, Product Recall
Territory: United Kingdom, Europe, Canada
Max Line Size: GBP 5,000,000
Currency: GBP
Minimum Premium: GBP 125,000
Inception Date: 2026-01-01
Expiry Date: 2026-12-31

Exclusions:
- Coal mining operations
- Sanctioned jurisdictions
- Standalone cyber extortion

Subjectivities:
- Updated valuation report within 90 days
- Cat model output from approved broker

Referral Triggers:
- Any one location over GBP 15,000,000 TIV
- New territory outside agreed list
`;

export const referralHeavySample = `Insured: Northlake Food Manufacturing
Classes: Property, Product Recall
Territories: United States, Canada
Maximum Line Size: USD 7,500,000
Currency: USD
Minimum Premium: USD 200,000
Effective Date: 2026-04-01
Expiration Date: 2027-03-31

Out of appetite:
- PFAS manufacturing exposure
- Unprotected cold storage over 45 days

Conditions:
- Engineering survey is mandatory before bind
- Formal crisis recall plan is required

Referrals:
- Limits above USD 7,500,000
- Loss ratio above 55%`;

export const malformedSample = `Insured Name: Unknown
Currency: GBP
Minimum Premium: GBP 80,000
Inception Date: 2026-07-01

Exclusions:
- None stated

Subjectivities:
- Signed proposal form required before bind`;

export const demoSamples = [
  {
    id: "balanced",
    label: "Balanced appetite",
    description: "Well-formed statement with classes, territories, limits, and controls.",
    statementText: multilineStatementSample
  },
  {
    id: "referral-heavy",
    label: "Referral-heavy appetite",
    description: "Higher referral and condition intensity for warning testing.",
    statementText: referralHeavySample
  },
  {
    id: "malformed",
    label: "Missing required data",
    description: "Intentionally incomplete to trigger the minimum-field gate.",
    statementText: malformedSample
  }
] as const;

export const howdenPublicSlipSample = `UNIQUE MARKET REFERENCE: B0180FN2520474
TYPE: Insurance
INSURED: Affiliated Clubs Of The England And Wales Cricket Board as set out in Appendix A
ADDRESS: Lord's Cricket Ground, London, NW8 8QZ, United Kingdom
PERIOD: From 01 February 2025 to 31 January 2026
INTEREST: Arising out of the Named Insured's Operations
LIMIT OF LIABILITY: GBP 2,000,000 Policy Aggregate Limit including claims expenses
RETENTION: GBP 50,000 any one claim and in the aggregate for each covered club
TERRITORIAL LIMITS: Worldwide
CLAIMS BASIS: Claims Made Basis - Retroactive Date: Full Prior Acts
NOTIFICATION OF CLAIMS TO: Howden Insurance Brokers Limited, FLnewclaims@howdengroup.com

Wording:
- LMA5567B War and Cyber Operation Exclusion
- LMA3100 Sanction Limitation and Exclusion Clause
- Cybersafe - E-Crime Endorsement

SUBJECTIVITIES: None
CHOICE OF LAW: Laws of England and Wales
CHOICE OF JURISDICTION: Courts of England and Wales
PAYMENT TERMS: LSW3001 PREMIUM PAYMENT CLAUSE - 60 DAYS`;

export const lmgTemplateFilledSample = `UNIQUE MARKET REFERENCE: B0500DEMO2026A
TYPE: Insurance
INSURED: Northlight Manufacturing Ltd
BROKER: Example Placement Brokers Ltd
PERIOD: From 01 April 2026 to 31 March 2027
TERRITORIAL LIMITS: United Kingdom, European Union
LIMIT OF LIABILITY: GBP 5,000,000 any one claim and in the annual aggregate
RETENTION: GBP 100,000 each and every claim
CURRENCY: GBP
CLAIMS BASIS: Claims Made Basis - Retroactive Date: 01 April 2020
NOTIFICATION OF CLAIMS TO: claims@placement-brokers.example

EXCLUSIONS:
- Sanction Limitation and Exclusion Clause
- War and Terrorism Exclusion

SUBJECTIVITIES:
- External penetration testing report due within 60 days
- Updated incident response plan required pre-bind

CHOICE OF LAW: England and Wales
CHOICE OF JURISDICTION: Courts of England and Wales`;

export const missingGateFieldsSample = `TYPE: Insurance
INSURED: Example Sports Association
BROKER: Sample Market Broker
TERRITORIAL LIMITS: Europe
CLAIMS BASIS: Claims Made Basis
NOTIFICATION OF CLAIMS TO: claims@sample-broker.example

EXCLUSIONS:
- Cyber extortion standalone losses

SUBJECTIVITIES:
- Security questionnaire outstanding`;

export const demoSamples = [
  {
    id: "public-howden-slip",
    label: "Public executed MRC",
    description: "Real publicly accessible market reform contract text sample.",
    statementText: howdenPublicSlipSample,
    sourceLabel: "howden-public-mrc-2025.txt"
  },
  {
    id: "lmg-template-sample",
    label: "LMG template-aligned",
    description: "MRC v3 field structure adapted to a complete test scenario.",
    statementText: lmgTemplateFilledSample,
    sourceLabel: "lmg-mrc-template-aligned.txt"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Intentionally incomplete to trigger the Day 4 required-field gate.",
    statementText: missingGateFieldsSample,
    sourceLabel: "missing-required-gate.txt"
  }
] as const;

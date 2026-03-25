export interface MrcCheckerSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  mrcText: string;
  question: string;
}

export const publicExecutedMrcSample = `UNIQUE MARKET REFERENCE: B0180FN2520474
TYPE: Insurance
INSURED: Affiliated Clubs Of The England And Wales Cricket Board as set out in Appendix A
BROKER: Howden Insurance Brokers Limited
PERIOD: From 01 February 2025 to 31 January 2026
INTEREST: Liability arising out of the Named Insured's cricket operations and associated activities
TERRITORIAL LIMITS: Worldwide
LIMIT OF LIABILITY: GBP 2,000,000 policy aggregate including claims expenses
RETENTION: GBP 50,000 any one claim and in the aggregate
NOTIFICATION OF CLAIMS TO: FLnewclaims@howdengroup.com
PAYMENT TERMS: LSW3001 Premium Payment Clause - 60 days

WORDING:
- LMA5567B War and Cyber Operation Exclusion
- LMA3100 Sanction Limitation and Exclusion Clause
- Cybersafe E-Crime Endorsement

SUBJECTIVITIES: None
CHOICE OF LAW: Laws of England and Wales
CHOICE OF JURISDICTION: Courts of England and Wales
SIGNED LINES: 100% written by Lloyd's syndicate panel`;

export const completeTemplateCheckSample = `UNIQUE MARKET REFERENCE: B0500DEMO2026A
TYPE: Insurance
INSURED: Northlight Manufacturing Ltd
BROKER: Example Placement Brokers Ltd
PERIOD: From 01 April 2026 to 31 March 2027
INTEREST: Global manufacturers product liability and recall exposures
TERRITORIAL LIMITS: United Kingdom, European Union, Canada
LIMIT OF LIABILITY: USD 5,000,000 any one occurrence and in the annual aggregate
RETENTION: USD 100,000 each and every claim
CURRENCY: USD
NOTIFICATION OF CLAIMS TO: claims@placement-brokers.example
PAYMENT TERMS: Premium due within 45 days of inception

CLAUSES:
- Sanction Limitation and Exclusion Clause
- Product recall endorsement
- Minimum earned premium clause

SUBJECTIVITIES:
- Updated loss runs to be provided before final signing
- Local admitted paper confirmation required for Canada

CHOICE OF LAW: New York law
CHOICE OF JURISDICTION: New York courts`;

export const missingRequiredGateSample = `TYPE: Insurance
INSURED: Example Sports Association
BROKER: Sample Market Broker
INTEREST: Community sports third-party liability
TERRITORIAL LIMITS: Europe

WORDING:
- War exclusion

SUBJECTIVITIES:
- Cyber control questionnaire outstanding`;

export const demoSamples: MrcCheckerSample[] = [
  {
    id: "public-executed-mrc",
    label: "Public executed MRC",
    description: "Public-style completed MRC text with market-standard clauses and clean gate coverage.",
    sourceLabel: "public-executed-mrc.txt",
    mrcText: publicExecutedMrcSample,
    question: "What warnings, referrals, and clause checks stand out?"
  },
  {
    id: "complete-template-check",
    label: "Complete template check",
    description: "Complete synthetic sample with subjectivities and non-England governing law.",
    sourceLabel: "complete-template-check.txt",
    mrcText: completeTemplateCheckSample,
    question: "Which clause checks need referral or reviewer attention?"
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete to fail the required-field gate.",
    sourceLabel: "missing-required-gate.txt",
    mrcText: missingRequiredGateSample,
    question: "Which required items are still missing from this MRC?"
  }
];

export interface OpsHealthSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  kpiText: string;
  question: string;
}

const balancedOps = `kpi,current,target,previous,owner,direction
Quote turnaround hours,31,30,32,Broking Ops,lower_better
Referral aging over 5d,11,10,12,Underwriting Ops,lower_better
Bind ratio pct,34,36,33,Placement,higher_better
Claims closure 30d pct,69,70,68,Claims,higher_better
Data quality completeness pct,96,97,95,Data Ops,higher_better`;

const stressedOps = `kpi,current,target,previous,owner,direction
Quote turnaround hours,52,30,41,Broking Ops,lower_better
Referral aging over 5d,26,10,18,Underwriting Ops,lower_better
Bind ratio pct,24,36,28,Placement,higher_better
Claims closure 30d pct,57,70,63,Claims,higher_better
Data quality completeness pct,90,97,94,Data Ops,higher_better`;

const missingOps = `kpi,current,target,previous,owner,direction
Quote turnaround hours,52,,41,Broking Ops,lower_better
Referral aging over 5d,26,10,18,Underwriting Ops,
Bind ratio pct,,36,28,Placement,higher_better`;

export const demoSamples: OpsHealthSample[] = [
  {
    id: "balanced-ops",
    label: "Balanced operations",
    description: "Mostly on-target KPIs with low-risk variance.",
    sourceLabel: "balanced-ops-kpis.csv",
    kpiText: balancedOps,
    question: "Which KPI should we monitor next week and why?"
  },
  {
    id: "stressed-ops",
    label: "Stressed operations",
    description: "Escalation pattern across turnaround, ageing, and bind ratio.",
    sourceLabel: "stressed-ops-kpis.csv",
    kpiText: stressedOps,
    question: "What are the top anomalies and immediate actions?"
  },
  {
    id: "missing-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete rows to trigger required-field validation.",
    sourceLabel: "missing-required-ops-kpis.csv",
    kpiText: missingOps,
    question: "Which columns are missing?"
  }
];

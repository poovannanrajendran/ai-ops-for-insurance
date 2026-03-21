export interface ExposureClashSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  schedulesText: string;
  question: string;
}

export const demoSamples: ExposureClashSample[] = [
  {
    id: "cross-schedule-overlap",
    label: "Cross-Schedule Overlap",
    description: "Two schedules overlap on insured, location, peril, and period.",
    sourceLabel: "cross-schedule-overlap.csv",
    schedulesText: `schedule_id,policy_id,insured_name,location,country,peril,period_start,period_end,tiv_gbp,limit_gbp
SCHED-A,POL-001,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-01-01,2026-12-31,8500000,5000000
SCHED-B,POL-774,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Flood,2026-03-01,2026-11-30,7200000,4500000
SCHED-B,POL-778,Delta Cold Chain,Hamburg Hub,Germany,Fire,2026-01-01,2026-12-31,3100000,1800000
SCHED-C,POL-921,Atlas Warehousing Ltd,Rotterdam Terminal,Netherlands,Storm,2026-01-01,2026-12-31,5400000,3000000`,
    question: "Where is the highest clash concentration by country?"
  },
  {
    id: "low-clash-spread",
    label: "Low Clash Spread",
    description: "Schedules are mostly distinct with one moderate overlap.",
    sourceLabel: "low-clash-spread.csv",
    schedulesText: `schedule_id,policy_id,insured_name,location,country,peril,period_start,period_end,tiv_gbp,limit_gbp
SCHED-A,POL-101,Northlight Foods,Leeds Plant,United Kingdom,Fire,2026-01-01,2026-12-31,4200000,2000000
SCHED-B,POL-404,Northlight Foods,Leeds Plant,United Kingdom,Fire,2026-06-01,2026-12-31,2500000,1200000
SCHED-C,POL-555,Bluewater Cargo,Felixstowe,United Kingdom,Flood,2026-01-01,2026-12-31,3900000,1800000`,
    question: "Do any overlaps require high-severity review?"
  },
  {
    id: "missing-required-gate",
    label: "Missing Required Gate",
    description: "Intentionally incomplete file to trigger required-field validation.",
    sourceLabel: "missing-required-gate.csv",
    schedulesText: `schedule_id,policy_id,insured_name
SCHED-A,POL-1,Test Insured`,
    question: "What is missing?"
  }
];

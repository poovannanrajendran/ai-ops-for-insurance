export interface BinderSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  csvText: string;
  question: string;
}

export const demoSamples: BinderSample[] = [
  {
    id: "amber-runway",
    label: "Amber runway",
    description: "High current utilization with modest forecast uplift and one dominant class cluster.",
    sourceLabel: "binder-amber-runway.csv",
    question: "Which class and territory should the binder manager review first?",
    csvText: `risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp,binder_capacity_gbp,forecast_additional_gbp,days_to_expiry,status
R-101,Northlight Estates,Real Estate,Property,United Kingdom,6200000,12000000,400000,95,Bound
R-102,Canal Foods,Real Estate,Property,Netherlands,1900000,12000000,350000,84,Bound
R-103,Alpine Fabrication,Real Estate,Engineering,Germany,1200000,12000000,250000,63,Quoted
R-104,Harbor Retail Group,Real Estate,Property,United Kingdom,900000,12000000,150000,47,Bound
R-105,Sierra Cold Chain,Real Estate,Marine Cargo,Spain,750000,12000000,100000,31,Quoted`
  },
  {
    id: "forecast-breach",
    label: "Forecast breach",
    description: "Current headroom remains, but quoted pipeline pushes the binder over delegated authority.",
    sourceLabel: "binder-forecast-breach.csv",
    question: "Will the binder breach on forecast and where is the concentration pressure?",
    csvText: `risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp,binder_capacity_gbp,forecast_additional_gbp,days_to_expiry,status
R-201,Atlas Foods Europe,Continental Trade,Property,France,5400000,10000000,600000,68,Bound
R-202,Delta Components,Continental Trade,Property,Germany,2100000,10000000,300000,55,Bound
R-203,Medline Wholesale,Continental Trade,Casualty,France,600000,10000000,850000,26,Quoted
R-204,Orbital Logistics,Continental Trade,Marine Cargo,Belgium,550000,10000000,900000,19,Quoted
R-205,Vega Mobility,Continental Trade,Property,France,450000,10000000,700000,12,Quoted`
  },
  {
    id: "minimum-gate",
    label: "Minimum gate",
    description: "Intentionally incomplete sample to trigger the required-field and minimum-row validation.",
    sourceLabel: "binder-minimum-gate.csv",
    question: "What is the binder capacity position?",
    csvText: `risk_id,insured_name,binder_name,class_of_business,territory,bound_amount_gbp
R-1,Short Example,Binder X,Property,UK,150000`,
  }
];

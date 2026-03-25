export const demoSamples = [
  {
    id: "balanced-book",
    label: "Balanced book",
    description: "Diversified property book with moderate European flood and windstorm exposure.",
    sourceLabel: "balanced-book.csv",
    question: "Which country and peril drive the stressed uplift?",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1001,Northshore Logistics,United Kingdom,Windstorm,Property,6200000,250000,3200000
EXP-1002,Northshore Logistics,Netherlands,Flood,Property,4800000,250000,2600000
EXP-1003,Alpine Components,Germany,Fire,Property,3900000,100000,2100000
EXP-1004,Baltic Retail Group,Poland,Windstorm,Property,3100000,150000,1700000
EXP-1005,Meridian Foods,France,Flood,Property,4400000,200000,2300000`
  },
  {
    id: "flood-stack",
    label: "Flood stack",
    description: "Higher Netherlands concentration with attachment structure worth stress-testing.",
    sourceLabel: "flood-stack.csv",
    question: "Show the Netherlands concentration and attachment review.",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-2201,Atlas Ports,Netherlands,Flood,Property,9100000,500000,4200000
EXP-2202,Atlas Ports,Netherlands,Flood,Property,8400000,450000,3900000
EXP-2203,Harbor Cold Chain,Netherlands,Windstorm,Property,5200000,300000,2600000
EXP-2204,Rhine Manufacturing,Germany,Fire,Property,4300000,200000,2200000
EXP-2205,Channel Warehousing,Belgium,Flood,Property,3600000,150000,2000000`
  },
  {
    id: "mixed-segments",
    label: "Mixed segments",
    description: "Property and cyber mix to compare segment concentration and scenario drift.",
    sourceLabel: "mixed-segments.csv",
    question: "Which segment carries the highest stressed loss?",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-3301,Vertex Payments,United Kingdom,Cyber,Cyber,2800000,100000,1800000
EXP-3302,Vertex Payments,Ireland,Cyber,Cyber,2600000,100000,1700000
EXP-3303,Helios Estates,Spain,Windstorm,Property,5400000,250000,3000000
EXP-3304,Helios Estates,Portugal,Flood,Property,4700000,250000,2400000
EXP-3305,Nova Distribution,Italy,Fire,Property,3500000,150000,1900000`
  }
] as const;

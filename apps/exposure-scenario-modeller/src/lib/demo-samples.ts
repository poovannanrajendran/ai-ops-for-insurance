export const demoSamples = [
  {
    id: "balanced-book",
    label: "Balanced book",
    description: "Diversified property book with moderate European flood and windstorm exposure.",
    sourceLabel: "balanced-book",
    question: "Which country and peril drive the stressed uplift?",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-1001,Northshore Logistics,United Kingdom,Windstorm,Property,4200000,250000,2800000
EXP-1002,Northshore Logistics,Netherlands,Windstorm,Cargo,3200000,150000,2600000
EXP-1003,Alpine Components,Germany,Fire,Manufacturing,2800000,100000,2000000
EXP-1004,Baltic Retail Group,Poland,Windstorm,Property,2400000,150000,1700000
EXP-1005,Meridian Foods,France,Flood,Property,2100000,200000,2200000
EXP-1006,North Point Energy,Spain,Hail,Energy,1700000,120000,1500000`
  },
  {
    id: "flood-stack",
    label: "Flood stack",
    description: "Higher Netherlands concentration with attachment structure worth stress-testing.",
    sourceLabel: "flood-stack",
    question: "Show the Netherlands concentration and attachment review.",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-2201,Atlas Ports,Netherlands,Flood,Property,5200000,420000,3100000
EXP-2202,Atlas Ports,Belgium,Flood,Property,4200000,370000,2800000
EXP-2203,Harbor Cold Chain,Netherlands,Windstorm,Property,3400000,260000,2200000
EXP-2204,Rhine Manufacturing,Germany,Fire,Property,2400000,140000,1800000
EXP-2205,Channel Warehousing,Belgium,Flood,Cargo,2100000,120000,1600000
EXP-2206,Coastal Renewables,France,Storm,Energy,1800000,90000,1300000`
  },
  {
    id: "mixed-segments",
    label: "Mixed segments",
    description: "Property and cyber mix to compare segment concentration and scenario drift.",
    sourceLabel: "mixed-segments",
    question: "Which segment carries the highest stressed loss?",
    csvText: `exposure_id,account_name,country,peril,segment,tiv_gbp,attachment_gbp,limit_gbp
EXP-3301,Vertex Payments,United Kingdom,Cyber,Cyber,2800000,100000,1800000
EXP-3302,Vertex Payments,Ireland,Cyber,Cyber,2600000,100000,1700000
EXP-3303,Helios Estates,Spain,Windstorm,Property,3200000,200000,2200000
EXP-3304,Helios Estates,Portugal,Flood,Property,3100000,220000,2100000
EXP-3305,Nova Distribution,Italy,Fire,Cargo,2800000,150000,1800000
EXP-3306,Nova Distribution,Italy,Earthquake,Industrial,2100000,120000,1400000`
  }
] as const;

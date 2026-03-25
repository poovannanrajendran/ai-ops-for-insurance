export interface PlacementSample {
  csvText: string;
  description: string;
  id: string;
  label: string;
  question: string;
  sourceLabel: string;
}

export const demoSamples: PlacementSample[] = [
  {
    id: "smart-follow-gap",
    label: "Smart follow gap",
    description: "Placed lead with open followers, one stale market, and shrinking capacity on a key quote.",
    sourceLabel: "smart-follow-gap.csv",
    question: "Which open markets need immediate follow-up to complete placement?",
    csvText: `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-401,Northbank Logistics,Broking Partners,Lead Syndicate,Placed,30,30,30,12000000,540000,1,2,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Harbor Mutual,Quoted,20,0,16,12000000,540000,6,-18,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Summit Re,Open,20,0,8,12000000,540000,4,-6,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Atlas Specialty,Placed,15,15,15,12000000,540000,1,5,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Canal Insurance,Follow Up,15,0,10,12000000,540000,7,-12,Property,United Kingdom`
  },
  {
    id: "steady-placed-book",
    label: "Steady placed book",
    description: "Balanced placement with modest open tail and stable market appetite.",
    sourceLabel: "steady-placed-book.csv",
    question: "How much of the line is already placed and where is the residual open capacity?",
    csvText: `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-512,Harbor Cold Storage,City Wholesale,North Syndicate,Placed,25,25,25,8000000,360000,1,3,Marine Cargo,Netherlands
PL-512,Harbor Cold Storage,City Wholesale,East Underwriters,Placed,25,25,25,8000000,360000,1,1,Marine Cargo,Netherlands
PL-512,Harbor Cold Storage,City Wholesale,West Specialty,Placed,20,20,20,8000000,360000,2,0,Marine Cargo,Netherlands
PL-512,Harbor Cold Storage,City Wholesale,Bluewater Risk,Quoted,15,0,15,8000000,360000,2,2,Marine Cargo,Netherlands
PL-512,Harbor Cold Storage,City Wholesale,Anchor Markets,Open,15,0,10,8000000,360000,3,-2,Marine Cargo,Netherlands`
  },
  {
    id: "required-field-gate",
    label: "Required field gate",
    description: "Intentionally incomplete to trigger the CSV required-field validation path.",
    sourceLabel: "required-field-gate.csv",
    question: "Which markets are still open?",
    csvText: `placement_id,account_name,broker,market_name,status,target_share_pct
PL-001,Short Example,Broker,Lead,Placed,30`
  }
];

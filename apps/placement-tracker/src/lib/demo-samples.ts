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
  },
  {
    id: "multi-class-programme",
    label: "Multi-class programme",
    description: "Energy programme with five lines across Property, Marine, and Liability - two markets declined, one stale.",
    sourceLabel: "multi-class-programme.csv",
    question: "Which declined lines need replacement and how much capacity is at risk?",
    csvText: `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-780,Caspian Energy Ltd,Global Risk Partners,Pinnacle Syndicate,Placed,25,25,25,25000000,1125000,1,0,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Continental Re,Placed,20,20,20,25000000,1125000,2,3,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Meridian Specialty,Declined,20,0,0,25000000,1125000,9,-25,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Pacific Underwriters,Follow Up,20,0,12,25000000,1125000,8,-10,Energy,Kazakhstan
PL-780,Caspian Energy Ltd,Global Risk Partners,Nordic Lines,Open,15,0,0,25000000,1125000,3,-5,Energy,Kazakhstan`
  },
  {
    id: "near-full-placement",
    label: "Near full placement",
    description: "Programme 95% placed, small open tail, renewal due in 5 days.",
    sourceLabel: "near-full-placement.csv",
    question: "What is the remaining open capacity and is placement on track?",
    csvText: `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-920,Thames Valley Power,City Brokers,Alpha Syndicate,Placed,30,30,30,18000000,720000,1,2,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Beta Markets,Placed,25,25,25,18000000,720000,1,1,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Gamma Re,Placed,20,20,20,18000000,720000,1,0,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Delta Specialty,Placed,20,20,20,18000000,720000,2,3,Power Generation,United Kingdom
PL-920,Thames Valley Power,City Brokers,Epsilon Lines,Open,5,0,5,18000000,720000,2,-2,Power Generation,United Kingdom`
  }
];

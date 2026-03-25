import { describe, expect, test } from "vitest";

import { buildPlacementInsight, parsePlacementCsv } from "@/services/analyze-placement";

const validCsv = `placement_id,account_name,broker,market_name,status,target_share_pct,signed_share_pct,quoted_share_pct,line_size_gbp,premium_gbp,follow_up_age_days,capacity_change_pct,class_of_business,territory
PL-401,Northbank Logistics,Broking Partners,Lead Syndicate,Placed,30,30,30,12000000,540000,1,2,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Harbor Mutual,Quoted,20,0,16,12000000,540000,6,-18,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Summit Re,Open,20,0,8,12000000,540000,4,-6,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Atlas Specialty,Placed,15,15,15,12000000,540000,1,5,Property,United Kingdom
PL-401,Northbank Logistics,Broking Partners,Canal Insurance,Follow Up,15,0,10,12000000,540000,7,-12,Property,United Kingdom`;

describe("parsePlacementCsv", () => {
  test("parses valid placement rows", () => {
    const parsed = parsePlacementCsv(validCsv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(5);
    expect(parsed.rows[1]?.status).toBe("quoted");
  });

  test("fails when a fuller dataset is not provided", () => {
    const parsed = parsePlacementCsv("placement_id,account_name\nPL-1,Short");

    expect(parsed.errors[0]).toContain("Provide at least one header row and two market rows");
  });

  test("fails when required columns are missing from a multi-row payload", () => {
    const parsed = parsePlacementCsv("placement_id,account_name,broker\nPL-1,Short,Broker\nPL-2,Another,Broker");

    expect(parsed.errors[0]).toContain("Missing required column");
  });
});

describe("buildPlacementInsight", () => {
  test("returns deterministic placed and open progression with priority flags", () => {
    const analysis = buildPlacementInsight(validCsv, "Which open markets need immediate follow-up?");

    expect(analysis.summary.placedSharePct).toBe(45);
    expect(analysis.summary.openSharePct).toBe(55);
    expect(analysis.summary.projectedSharePct).toBe(79);
    expect(analysis.statusLanes[0]?.status).toBe("placed");
    expect(analysis.priorityFlags.some((flag) => flag.code === "stale_follow_up")).toBe(true);
    expect(analysis.marketProgression[0]?.priority).toBe("critical");
  });
});

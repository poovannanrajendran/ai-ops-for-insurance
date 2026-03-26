import { describe, expect, it } from "vitest";

import { analyzeStakeholderComms } from "@/services/analyze-stakeholder-comms";

describe("analyzeStakeholderComms", () => {
  it("extracts required fields and produces a draft", () => {
    const { analysis } = analyzeStakeholderComms({
      sourceLabel: "sample.txt",
      commsText:
        "comms_type=Board Update\naudience=Executive Committee\ntone=Formal\nsubject=Q2 update\ncontext=Stable quarter\nmessage_1=Queue age down\nmessage_2=Leakage below threshold\naction_1=Approve hiring",
      prompt: "What should execs focus on?"
    });

    expect(analysis.summary.completenessPct).toBeGreaterThanOrEqual(90);
    expect(analysis.summary.status).toBe("ready");
    expect(analysis.draft).toContain("Subject:");
  });

  it("fails required-field gate when mandatory fields are missing", () => {
    const { analysis } = analyzeStakeholderComms({
      sourceLabel: "missing.txt",
      commsText: "audience=Ops\nmessage_1=Draft",
      prompt: "Can we publish now?"
    });

    expect(analysis.summary.completenessPct).toBeLessThan(70);
    expect(analysis.summary.status).toBe("blocked");
    expect(analysis.fields.some((field) => field.status === "missing")).toBe(true);
  });
});

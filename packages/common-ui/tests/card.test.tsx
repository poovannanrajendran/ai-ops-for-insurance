import { describe, expect, it } from "vitest";

import { Card } from "../src/card";

describe("Card", () => {
  it("keeps the shared visible border class for cross-app visual consistency", () => {
    const element = Card({
      eyebrow: "Intake",
      title: "Test card",
      children: "Body"
    });

    expect(element.props.className).toContain("border");
    expect(element.props.className).toContain("border-slate-500/55");
  });
});


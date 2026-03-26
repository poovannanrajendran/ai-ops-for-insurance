import { expect, test } from "@playwright/test";

type DayApp = {
  day: number;
  name: string;
  url: string;
};

const apps: DayApp[] = [
  { day: 1, name: "Submission Triage Copilot", url: "http://localhost:3001" },
  { day: 2, name: "Portfolio Mix Dashboard", url: "http://localhost:3002" },
  { day: 3, name: "Risk Appetite Parser", url: "http://localhost:3003" },
  { day: 4, name: "Slip Reviewer", url: "http://localhost:3004" },
  { day: 5, name: "Class of Business Classifier", url: "http://localhost:3005" },
  { day: 6, name: "Exposure Accumulation Heatmap", url: "http://localhost:3006" },
  { day: 7, name: "Cat Event Briefing", url: "http://localhost:3007" },
  { day: 8, name: "Policy Endorsement Diff Checker", url: "http://localhost:3008" },
  { day: 9, name: "Referral Priority Queue Scorer", url: "http://localhost:3009" },
  { day: 10, name: "Claims FNOL Triage Assistant", url: "http://localhost:3010" },
  { day: 11, name: "Binder Capacity Monitor", url: "http://localhost:3011" },
  { day: 12, name: "Treaty Structure Explainer", url: "http://localhost:3012" },
  { day: 13, name: "Exposure Clash Detector", url: "http://localhost:3013" },
  { day: 14, name: "Claims Leakage Flagger", url: "http://localhost:3014" },
  { day: 15, name: "Broker Submission Builder", url: "http://localhost:3015" },
  { day: 16, name: "Exposure Scenario Modeller", url: "http://localhost:3016" },
  { day: 17, name: "MRC Checker", url: "http://localhost:3017" },
  { day: 18, name: "Placement Tracker", url: "http://localhost:3018" },
  { day: 19, name: "Wording Risk Diff Checker", url: "http://localhost:3019" }
];

const actionButtonText =
  /(analy|build|explain|detect|flag|score|triage|classify|brief|parse|review|track|diff|compare|check)/i;

function selectedDays(): Set<number> {
  const raw = process.env.CONSOLE_GUARD_DAYS;
  if (!raw) {
    return new Set(apps.map((app) => app.day));
  }

  return new Set(
    raw
      .split(",")
      .map((token) => Number.parseInt(token.trim(), 10))
      .filter((value) => Number.isFinite(value))
  );
}

for (const app of apps) {
  test(`day ${app.day}: ${app.name} has no runtime console/page errors in sample flow`, async ({ page }) => {
    const days = selectedDays();
    test.skip(!days.has(app.day), `Day ${app.day} not selected by CONSOLE_GUARD_DAYS.`);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    try {
      await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 10_000 });
    } catch {
      test.skip(true, `App unavailable at ${app.url}`);
      return;
    }

    const sampleButton = page.getByRole("button", { name: /sample/i }).first();
    if ((await sampleButton.count()) > 0) {
      await sampleButton.click();
    }

    const runButton = page.getByRole("button").filter({ hasText: actionButtonText }).first();
    await expect(runButton).toBeVisible();
    await runButton.click();

    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();

    const criticalConsoleErrors = consoleErrors.filter(
      (entry) =>
        !entry.includes("favicon.ico") &&
        !entry.includes("NO_COLOR") &&
        !entry.includes("Failed to load resource")
    );

    const duplicateKeyErrors = criticalConsoleErrors.filter((entry) =>
      entry.includes("Encountered two children with the same key")
    );
    const hydrationErrors = criticalConsoleErrors.filter((entry) =>
      /hydration|hydrated|did not match/i.test(entry)
    );

    expect(
      criticalConsoleErrors,
      `Console errors on day ${app.day} (${app.name}):\n${criticalConsoleErrors.join("\n")}`
    ).toHaveLength(0);
    expect(
      duplicateKeyErrors,
      `Duplicate key errors on day ${app.day} (${app.name}):\n${duplicateKeyErrors.join("\n")}`
    ).toHaveLength(0);
    expect(
      hydrationErrors,
      `Hydration errors on day ${app.day} (${app.name}):\n${hydrationErrors.join("\n")}`
    ).toHaveLength(0);
    expect(pageErrors, `Page errors on day ${app.day} (${app.name}):\n${pageErrors.join("\n")}`).toHaveLength(
      0
    );
  });
}

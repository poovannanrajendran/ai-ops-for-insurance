import { expect, test } from "@playwright/test";

const pages = [
  { day: "12", url: "http://localhost:3012", buttonName: "Explain treaty" },
  { day: "13", url: "http://localhost:3013", buttonName: "Detect clashes" },
  { day: "14", url: "http://localhost:3014", buttonName: "Flag leakage" }
];

for (const pageConfig of pages) {
  test(`day ${pageConfig.day} keeps bordered card style and status section`, async ({ page }) => {
    await page.goto(pageConfig.url, { waitUntil: "domcontentloaded" });

    const intakeHeading = page.getByRole("heading", { name: /source and/i }).first();
    await expect(intakeHeading).toBeVisible();

    const intakeCard = page.locator("section").filter({ has: intakeHeading }).first();
    const borderTopWidth = await intakeCard.evaluate(
      (element) => getComputedStyle(element).borderTopWidth
    );
    expect(borderTopWidth).not.toBe("0px");

    const actionButton = page.getByRole("button", { name: pageConfig.buttonName });
    await expect(actionButton).toBeVisible();

    const warningsHeading = page.getByRole("heading", { name: /warnings|flags/i }).first();
    await expect(warningsHeading).toBeVisible();

    await page.screenshot({
      path: `.artifacts/day12-14-visual/day-${pageConfig.day}-visual.png`,
      fullPage: true
    });
  });
}

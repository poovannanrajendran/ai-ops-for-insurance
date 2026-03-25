import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;
const appKey = process.env.APP_KEY ?? "app";

test("visual smoke: bordered cards and intake section are visible", async ({ page }) => {
  if (!targetUrl) {
    test.skip(true, "TARGET_URL is not set");
    return;
  }

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const intakeHeading = page.getByRole("heading", { name: /intake|source and/i }).first();
  await expect(intakeHeading).toBeVisible();

  const intakeCard = page.locator("section").filter({ has: intakeHeading }).first();
  const borderTopWidth = await intakeCard.evaluate(
    (element) => getComputedStyle(element).borderTopWidth
  );
  expect(borderTopWidth).not.toBe("0px");

  await page.screenshot({
    path: `.artifacts/visual-smoke/${appKey}.png`,
    fullPage: true
  });
});


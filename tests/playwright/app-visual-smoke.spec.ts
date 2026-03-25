import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;
const appKey = process.env.APP_KEY ?? "app";

test("visual smoke: bordered cards and intake section are visible", async ({ page }) => {
  if (!targetUrl) {
    test.skip(true, "TARGET_URL is not set");
    return;
  }

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const roleHeading = page.getByRole("heading", { name: /intake|source and/i }).first();
  const hasRoleHeading = (await roleHeading.count()) > 0;

  let intakeCard = page.locator("section").first();
  if (hasRoleHeading) {
    await expect(roleHeading).toBeVisible();
    intakeCard = page.locator("section").filter({ has: roleHeading }).first();
  } else {
    const intakeLabel = page.getByText(/intake/i).first();
    await expect(intakeLabel).toBeVisible();
    intakeCard = page.locator("section").filter({ has: intakeLabel }).first();
  }

  await expect(intakeCard).toBeVisible();

  await page.screenshot({
    path: `.artifacts/visual-smoke/${appKey}.png`,
    fullPage: true
  });
});

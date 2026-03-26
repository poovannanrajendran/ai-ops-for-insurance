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

  const uploadZone = page.getByText(/upload zone/i).first();
  await expect(uploadZone).toBeVisible();
  const intakeStyles = await uploadZone.evaluate((labelElement) => {
    let node: HTMLElement | null = labelElement as HTMLElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const width = Number.parseFloat(style.borderTopWidth || "0");
      if (width > 0 && style.borderTopStyle !== "none") {
        return {
          borderTopWidth: style.borderTopWidth,
          borderTopStyle: style.borderTopStyle,
          borderTopColor: style.borderTopColor,
          borderRadius: style.borderTopLeftRadius
        };
      }
      node = node.parentElement;
    }
    return {
      borderTopWidth: "0px",
      borderTopStyle: "none",
      borderTopColor: "rgba(0, 0, 0, 0)",
      borderRadius: "0px"
    };
  });

  expect(Number.parseFloat(intakeStyles.borderTopWidth)).toBeGreaterThan(0);
  expect(intakeStyles.borderTopStyle).not.toBe("none");
  expect(intakeStyles.borderTopColor).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
  expect(Number.parseFloat(intakeStyles.borderRadius)).toBeGreaterThanOrEqual(8);

  const wrapper = page.locator("div[class*='max-w-']").first();
  await expect(wrapper).toBeVisible();
  const wrapperMaxWidth = await wrapper.evaluate((element) => getComputedStyle(element).maxWidth);
  expect(wrapperMaxWidth).not.toBe("none");

  const actionButton = page
    .getByRole("button")
    .filter({ hasText: /(analy|build|explain|detect|flag|score|triage|classify|brief|parse|review|track|diff|compare|check)/i })
    .first();
  await expect(actionButton).toBeVisible();
  const actionStyles = await actionButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderRadius: style.borderTopLeftRadius,
      backgroundColor: style.backgroundColor
    };
  });
  expect(Number.parseFloat(actionStyles.borderRadius)).toBeGreaterThanOrEqual(16);
  expect(actionStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  await page.screenshot({
    path: `.artifacts/visual-smoke/${appKey}.png`,
    fullPage: true
  });
});

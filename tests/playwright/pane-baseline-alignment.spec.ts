import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;

test("pane baseline alignment: source and csv/text cards start at same baseline", async ({ page }) => {
  if (!targetUrl) {
    test.skip(true, "TARGET_URL is not set");
    return;
  }

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const intakeSection = page.locator("section, div").filter({ hasText: /Intake/i }).first();
  if ((await intakeSection.count()) === 0) {
    test.skip(true, "Intake section not detectable for this app.");
    return;
  }

  const sourcePane = intakeSection.getByText(/upload zone/i).first();
  const rightCandidates = intakeSection.locator("h2, h3, h4, label, p").filter({
    hasText: /csv|statement|note|ledger|wording|dataset|text/i
  });
  const rightCount = await rightCandidates.count();
  let textPane: ReturnType<typeof rightCandidates.nth> | null = null;

  if ((await sourcePane.count()) > 0) {
    const sourceBox = await sourcePane.boundingBox();
    for (let index = 0; index < rightCount; index += 1) {
      const candidate = rightCandidates.nth(index);
      const box = await candidate.boundingBox();
      if (!box || !sourceBox) continue;
      if (box.x > sourceBox.x + 120) {
        textPane = candidate;
        break;
      }
    }
  }

  if ((await sourcePane.count()) === 0 || !textPane) {
    test.skip(true, "Expected split panes not detected.");
    return;
  }

  await expect(sourcePane).toBeVisible();
  await expect(textPane).toBeVisible();

  const sourceCard = sourcePane.locator("xpath=ancestor::*[self::section or self::div][1]");
  const textCard = textPane.locator("xpath=ancestor::*[self::section or self::div][1]");
  const left = await sourceCard.boundingBox();
  const right = await textCard.boundingBox();
  expect(left).toBeTruthy();
  expect(right).toBeTruthy();
  if (!left || !right) return;

  expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(8);
});

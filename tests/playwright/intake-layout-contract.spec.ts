import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;

test("intake layout contract: split panes are top-aligned", async ({ page }) => {
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

  const headingCandidates = intakeSection.locator("h2, h3, h4, label, p");
  const candidateCount = await headingCandidates.count();
  let leftHeading: ReturnType<typeof headingCandidates.nth> | null = null;
  let rightHeading: ReturnType<typeof headingCandidates.nth> | null = null;

  for (let index = 0; index < candidateCount; index += 1) {
    const candidate = headingCandidates.nth(index);
    const text = (await candidate.innerText()).trim();
    const box = await candidate.boundingBox();
    if (!box) continue;

    if (!leftHeading && /source|input|portfolio|source and/i.test(text)) {
      leftHeading = candidate;
      continue;
    }

    if (leftHeading && /csv|text|statement|ledger|wording|dataset|note/i.test(text)) {
      const leftBox = await leftHeading.boundingBox();
      if (leftBox && box.x > leftBox.x + 120) {
        rightHeading = candidate;
        break;
      }
    }
  }

  if (!leftHeading || !rightHeading) {
    test.skip(true, "Split-pane headings not detectable for this app.");
    return;
  }

  await expect(leftHeading).toBeVisible();
  await expect(rightHeading).toBeVisible();

  const left = await leftHeading.boundingBox();
  const right = await rightHeading.boundingBox();
  expect(left).toBeTruthy();
  expect(right).toBeTruthy();
  if (!left || !right) return;

  // Accept small visual tolerance for font rendering differences.
  expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(8);
});

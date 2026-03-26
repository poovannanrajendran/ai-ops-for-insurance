import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;

test("csv pane border contract: no nested double-border textarea shells", async ({ page }) => {
  if (!targetUrl) {
    test.skip(true, "TARGET_URL is not set");
    return;
  }

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const csvHeading = page.getByText(/csv|ledger|statement text|submission note|treaty wording/i).first();
  if ((await csvHeading.count()) === 0) {
    test.skip(true, "No CSV/text pane heading found for this app.");
    return;
  }
  await expect(csvHeading).toBeVisible();

  const shellInfo = await csvHeading.evaluate((heading) => {
    const countBorderedAncestors = (node: HTMLElement | null) => {
      let count = 0;
      let cursor = node;
      while (cursor && cursor !== document.body) {
        const style = getComputedStyle(cursor);
        const borderWidth = Number.parseFloat(style.borderTopWidth || "0");
        if (borderWidth > 0 && style.borderTopStyle !== "none") count += 1;
        cursor = cursor.parentElement;
      }
      return count;
    };

    const paneRoot = (heading as HTMLElement).parentElement;
    const textarea = paneRoot?.querySelector("textarea");
    const input = paneRoot?.querySelector("input");

    return {
      paneBorderCount: countBorderedAncestors(paneRoot as HTMLElement),
      textareaBorderCount: countBorderedAncestors(textarea as HTMLElement | null),
      inputBorderCount: countBorderedAncestors(input as HTMLElement | null)
    };
  });

  // Guard against accidental extra nesting regressions:
  // the textarea/input path should not introduce 2+ extra bordered wrappers beyond pane shell.
  const extraTextAreaBorders = shellInfo.textareaBorderCount - shellInfo.paneBorderCount;
  const extraInputBorders = shellInfo.inputBorderCount - shellInfo.paneBorderCount;
  expect(extraTextAreaBorders).toBeLessThanOrEqual(1);
  expect(extraInputBorders).toBeLessThanOrEqual(1);
});

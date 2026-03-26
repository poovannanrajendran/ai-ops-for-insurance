import { expect, test } from "@playwright/test";

const targetUrl = process.env.TARGET_URL;

test("runtime guard: no duplicate React key errors during sample flow", async ({ page }) => {
  if (!targetUrl) {
    test.skip(true, "TARGET_URL is not set");
    return;
  }

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  const sampleButton = page.getByRole("button", { name: /sample/i }).first();
  if ((await sampleButton.count()) > 0) {
    await sampleButton.click();
  }

  const runButton = page
    .getByRole("button")
    .filter({ hasText: /(analy|build|explain|detect|flag|score|triage|classify|brief|parse|review|track|diff|compare|check)/i })
    .first();
  if ((await runButton.count()) === 0) {
    test.skip(true, "No run action button found.");
    return;
  }

  await runButton.click();
  await page.waitForLoadState("networkidle");

  const duplicateKeyErrors = consoleErrors.filter((entry) =>
    entry.includes("Encountered two children with the same key")
  );
  expect(duplicateKeyErrors).toHaveLength(0);
});

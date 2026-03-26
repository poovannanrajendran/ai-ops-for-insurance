import { expect, test } from "@playwright/test";

test("day 15 referral sample does not emit duplicate React key errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("http://localhost:3015", { waitUntil: "domcontentloaded" });

  await page.getByText("REFERRAL LIABILITY", { exact: false }).first().click();
  await page.getByRole("button", { name: "Build submission" }).click();

  await expect(page.getByRole("heading", { name: "Build overview" })).toBeVisible();

  const duplicateKeyErrors = consoleErrors.filter((entry) =>
    entry.includes("Encountered two children with the same key")
  );
  expect(duplicateKeyErrors).toHaveLength(0);
});

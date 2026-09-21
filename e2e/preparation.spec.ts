import { expect, test } from "@playwright/test";

test.describe("preparation experience", () => {
  test.skip(
    process.env.RUN_PREPARATION_E2E !== "1",
    "Set RUN_PREPARATION_E2E=1 with a local authenticated session and API stack",
  );

  test("renders preparation tasks without horizontal overflow", async ({ page }) => {
    await page.goto("/preparacion");
    await expect(
      page.getByRole("heading", { name: /Preparar a tiempo/i }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});

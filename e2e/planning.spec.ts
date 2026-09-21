import { expect, test } from "@playwright/test";

test.describe("meal planning experience", () => {
  test.skip(
    process.env.RUN_PLANNING_E2E !== "1",
    "Set RUN_PLANNING_E2E=1 with a local authenticated session and API stack",
  );

  test("renders the week plan without horizontal overflow", async ({ page }) => {
    await page.goto("/plan");
    await expect(
      page.getByRole("heading", { name: /Semana del|todavía no tiene plan/i }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});

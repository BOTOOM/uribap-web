import { expect, test } from "@playwright/test";

test.describe("demand forecast experience", () => {
  test.skip(
    process.env.RUN_FORECAST_E2E !== "1",
    "Set RUN_FORECAST_E2E=1 with a local authenticated session and API stack",
  );

  test("renders the forecast window without horizontal overflow", async ({ page }) => {
    await page.goto("/forecast");
    await expect(page.getByRole("heading", { name: /Demanda del/i })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test("navigates to the next week window", async ({ page }) => {
    await page.goto("/forecast");
    await page.getByRole("link", { name: /Semana siguiente/i }).click();
    await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/);
    await expect(page.getByRole("heading", { name: /Demanda del/i })).toBeVisible();
  });
});

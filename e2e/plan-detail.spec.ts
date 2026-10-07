import { expect, test } from "@playwright/test";

test.describe("plan meal detail", () => {
  test.skip(
    process.env.RUN_PLANNING_E2E !== "1",
    "Set RUN_PLANNING_E2E=1 with a local authenticated session and API stack",
  );

  test("shows a selected meal's detail without horizontal overflow", async ({ page }) => {
    await page.goto("/plan");

    const meal = page.locator(".meal-card:not(.empty)").first();
    await expect(meal).toBeVisible();
    await meal.click();
    const dialog = page.getByRole("dialog", { name: "Detalle de la comida" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Ingredientes" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Preparación" })).toBeVisible();

    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });
});

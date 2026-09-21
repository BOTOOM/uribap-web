import { expect, test } from "@playwright/test";

test.describe("shopping list experience", () => {
  test.skip(
    process.env.RUN_SHOPPING_E2E !== "1",
    "Set RUN_SHOPPING_E2E=1 with a local authenticated session and API stack",
  );

  test("renders the shopping list without horizontal overflow", async ({ page }) => {
    await page.goto("/compra");
    await expect(
      page.getByRole("heading", { name: /Compra del|Todavía no hay lista/i }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});

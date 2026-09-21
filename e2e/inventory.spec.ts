import { expect, test } from "@playwright/test";

test.describe("inventory experience", () => {
  test.skip(
    process.env.RUN_INVENTORY_E2E !== "1",
    "Set RUN_INVENTORY_E2E=1 with a local authenticated session and API stack",
  );

  test("renders the inventory story without horizontal overflow", async ({ page }) => {
    await page.goto("/inventario");
    await expect(page.getByRole("heading", { name: /Lo que existe, lote por lote/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: "Registrar lote" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ajustar saldo" })).toBeVisible();
  });
});

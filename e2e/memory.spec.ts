import { expect, test } from "@playwright/test";

test.describe("household memory settings", () => {
  test.skip(
    process.env.RUN_MEMORY_E2E !== "1",
    "Set RUN_MEMORY_E2E=1 with a local authenticated session and API stack",
  );

  test("adds and forgets a household memory without horizontal overflow", async ({ page }) => {
    await page.goto("/settings/memoria");
    await expect(page.getByRole("heading", { name: "Memoria del hogar" })).toBeVisible();

    const content = `E2E household memory ${Date.now()}`;
    await page.getByLabel("Tipo de recuerdo nuevo").first().selectOption("note");
    await page.getByLabel("Recuerdo nuevo").first().fill(content);
    await page.getByRole("button", { name: "Agregar recuerdo" }).first().click();
    await expect(page.getByText(content)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Olvidar recuerdo: ${content}` }).click();
    await expect(page.getByText(content)).toHaveCount(0);

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  });
});

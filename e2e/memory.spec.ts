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
    await page.getByLabel("Tipo de recuerdo nuevo", { exact: true }).first().selectOption("note");
    await page.getByLabel("Recuerdo nuevo", { exact: true }).first().fill(content);
    await page.getByRole("button", { name: "Agregar recuerdo" }).first().click();
    await expect(page.getByText(content)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Olvidar recuerdo: ${content}` }).click();
    await expect(page.getByText(content)).toHaveCount(0);

    const dinerName = `E2E diner ${Date.now()}`;
    await page.getByLabel("Nombre de la persona").fill(dinerName);
    await page.getByRole("button", { name: "Agregar persona" }).click();
    const dinerCard = page.locator("article.memory-diner-card").filter({ hasText: dinerName });
    await expect(
      dinerCard.getByRole("heading", { name: dinerName, exact: true }),
    ).toBeVisible();

    await dinerCard.getByLabel("Tipo de recuerdo nuevo", { exact: true }).selectOption("restriction");
    await dinerCard.getByLabel("Recuerdo nuevo", { exact: true }).fill("E2E sin nueces");
    await dinerCard.getByRole("button", { name: "Agregar recuerdo" }).click();
    await expect(dinerCard.getByText("E2E sin nueces")).toBeVisible();

    await dinerCard.getByLabel("Tipo de recuerdo nuevo", { exact: true }).selectOption("like");
    await dinerCard.getByLabel("Recuerdo nuevo", { exact: true }).fill("E2E le gusta el arroz");
    await dinerCard.getByRole("button", { name: "Agregar recuerdo" }).click();
    await expect(dinerCard.getByText("E2E le gusta el arroz")).toBeVisible();

    const restrictionHeading = dinerCard.getByRole("heading", { name: "Restricción" });
    const likeHeading = dinerCard.getByRole("heading", { name: "Le gusta" });
    await expect(restrictionHeading).toBeVisible();
    await expect(likeHeading).toBeVisible();
    const restrictionBox = await restrictionHeading.boundingBox();
    const likeBox = await likeHeading.boundingBox();
    expect(restrictionBox).not.toBeNull();
    expect(likeBox).not.toBeNull();
    expect(restrictionBox!.y).toBeLessThan(likeBox!.y);

    page.once("dialog", (dialog) => dialog.accept());
    await dinerCard.getByRole("button", { name: "Archivar persona" }).click();
    await expect(
      page.getByText(`Se archivó a “${dinerName}”.`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: dinerName, exact: true }),
    ).toHaveCount(0);

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  });
});

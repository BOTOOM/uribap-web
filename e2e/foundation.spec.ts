import { expect, test } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

for (const viewport of viewports) {
  test(`public auth shell is responsive at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");

    await expect(page).toHaveTitle(/Uribap/);
    await expect(
      page.getByRole("heading", { name: "Entra para cuidar el plan de casa." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar a Uribap" }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
}

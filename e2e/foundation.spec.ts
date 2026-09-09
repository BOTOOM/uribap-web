import { expect, test } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

for (const viewport of viewports) {
  test(`foundation shell is responsive at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page).toHaveTitle(/Uribap/);
    const navigationName = viewport.width <= 700 ? /móvil/i : /principal/i;
    await expect(page.getByRole("navigation", { name: navigationName })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lo que vamos");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

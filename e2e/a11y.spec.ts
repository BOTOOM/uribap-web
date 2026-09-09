import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoSeriousViolations(page: Page, include?: string) {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const results = await builder.analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
}

test("foundation shell has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expectNoSeriousViolations(page);

  await page.getByRole("button", { name: "Más acciones" }).click();
  await expectNoSeriousViolations(page, '[role="menu"]');
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Abrir detalle" }).click();
  await expectNoSeriousViolations(page, '[role="dialog"]');
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoSeriousViolations(page: Page, include?: string) {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const results = await builder.analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
}

test("public auth shell has no serious accessibility violations", async ({ page }) => {
  await page.goto("/login");
  await expectNoSeriousViolations(page);

  await page.getByRole("button", { name: "Entrar a Uribap" }).focus();
  await expect(page.getByRole("button", { name: "Entrar a Uribap" })).toBeFocused();
});

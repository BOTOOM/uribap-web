import { expect, test } from "@playwright/test";

test("unauthenticated access to a protected view redirects to login", async ({ page }) => {
  await page.goto("/plan");

  await expect(page).toHaveURL(/\/login\?returnTo=%2Fplan/);
  await expect(
    page.getByRole("heading", { name: "Entra para cuidar el plan de casa." }),
  ).toBeVisible();
});

test("login sanitizes an unsafe returnTo parameter", async ({ page }) => {
  await page.goto("/login?returnTo=//evil.example.com");

  await expect(page).toHaveTitle(/Uribap/);
  await expect(
    page.getByRole("button", { name: "Entrar a Uribap" }),
  ).toBeVisible();
});

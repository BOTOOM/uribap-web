import { expect, test } from "@playwright/test";

const identityEnabled = Boolean(
  process.env.URIBAP_TEST_IDENTITY &&
    process.env.ZITADEL_TEST_USERNAME &&
    process.env.ZITADEL_TEST_PASSWORD,
);

test.describe("local Auth.js session boundary", () => {
  test.skip(!identityEnabled, "Set synthetic ZITADEL credentials to run session tests");

  test("federated logout clears the local session boundary", async ({ page, context }) => {
    await page.goto("http://localhost:3000/login?returnTo=/plan");
    await page.getByRole("button", { name: "Entrar con ZITADEL" }).click();
    await page.waitForURL(/localhost:8080/);
    const loginName = page.locator('input[name="loginName"]');
    if (await loginName.count()) {
      await loginName.fill(process.env.ZITADEL_TEST_USERNAME ?? "");
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.locator('input[name="password"]').fill(process.env.ZITADEL_TEST_PASSWORD ?? "");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/localhost:3000\/(onboarding|plan)/);

    const logoutResponse = await page.request.post(
      "http://localhost:3000/api/auth/federated-logout",
      { maxRedirects: 0 },
    );
    expect([302, 303, 307]).toContain(logoutResponse.status());
    const cookies = await context.cookies("http://localhost:3000");
    expect(cookies.some((cookie) => /authjs\.session-token/i.test(cookie.name))).toBe(false);
  });
});

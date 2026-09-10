import { expect, test } from "@playwright/test";

const identityEnabled = Boolean(
  process.env.URIBAP_TEST_IDENTITY &&
    process.env.ZITADEL_TEST_USERNAME &&
    process.env.ZITADEL_TEST_PASSWORD,
);

test.describe("local ZITADEL identity", () => {
  test.skip(!identityEnabled, "Set URIBAP_TEST_IDENTITY and synthetic ZITADEL credentials to run local identity E2E");

  test("logs in with PKCE without exposing provider tokens", async ({ page, context }) => {
    const clientAuthorizationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith("http://localhost:3000") && request.headers().authorization) {
        clientAuthorizationRequests.push(request.url());
      }
    });

    await page.goto("http://localhost:3000/login?returnTo=/onboarding");
    await page.getByRole("button", { name: "Entrar con ZITADEL" }).click();
    await page.waitForURL(/localhost:8080/);
    const loginName = page.locator('input[name="loginName"]');
    if (await loginName.count()) {
      await loginName.fill(process.env.ZITADEL_TEST_USERNAME ?? "");
      await page.getByRole("button", { name: "Continue" }).click();
    }
    const password = page.locator('input[name="password"]');
    await password.waitFor({ timeout: 30000 });
    await password.fill(process.env.ZITADEL_TEST_PASSWORD ?? "");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/localhost:3000\/(onboarding|plan)/);

    const cookies = await context.cookies("http://localhost:3000");
    expect(cookies.some((cookie) => /access|refresh|id.token/i.test(cookie.name))).toBe(false);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(clientAuthorizationRequests).toEqual([]);
  });
});

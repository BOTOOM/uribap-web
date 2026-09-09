import { expect, test } from "@playwright/test";

test("renders a safe unavailable state when the API cannot be reached", async ({ page }) => {
  await page.route("**/api/v1/health/live", (route) => route.abort("failed"));
  await page.goto("/foundation/api-state");

  await expect(page.getByRole("alert", { name: "El servicio no responde" })).toBeVisible();
  await expect(page.getByText("El hogar no cambió")).toBeVisible();
});

test("renders a safe error state for a failed API response", async ({ page }) => {
  await page.route("**/api/v1/health/live", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.goto("/foundation/api-state");

  await expect(page.getByRole("alert", { name: "La API rechazó la solicitud" })).toBeVisible();
});

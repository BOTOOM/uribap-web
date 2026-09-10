import { expect, test } from "@playwright/test";

test("local Web and API health boundaries are available", async ({ request }) => {
  const web = await request.get("/api/health");
  expect(web.ok()).toBe(true);
  expect(await web.json()).toMatchObject({ status: "ok", service: "uribap-web" });

  const api = await request.get("http://localhost:8010/api/v1/health/live");
  expect(api.ok()).toBe(true);
  expect((await api.json()).status).toBe("ok");
});

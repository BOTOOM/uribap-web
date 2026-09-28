import { readdir } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

import { expect, test } from "@playwright/test";

async function staticStylesAndScripts(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return staticStylesAndScripts(path);
      return /\.(?:css|js)$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

test("serves built Next CSS and JavaScript assets from the standalone server", async ({ request }) => {
  test.skip(!process.env.CI, "Standalone static asset packaging is verified in CI after the production build");
  const staticAssets = await staticStylesAndScripts(join(".next", "static"));
  const cssAsset = staticAssets.find((asset) => extname(asset) === ".css");
  const jsAsset = staticAssets.find((asset) => extname(asset) === ".js");

  expect(cssAsset).toBeDefined();
  expect(jsAsset).toBeDefined();
  for (const asset of [cssAsset, jsAsset]) {
    if (!asset) continue;
    const route = `/_next/${relative(".next", asset).split(sep).join("/")}`;
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
});

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

test("serves built Next CSS and JavaScript assets", async ({ page }) => {
  test.skip(!process.env.CI, "Production static assets are checked in CI after the build");
  const loadedTypes = new Set<string>();
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/_next/static/")) return;
    const type = /\.(css|js)$/.exec(url.pathname)?.[1];
    if (!type) return;
    if (response.status() === 200) loadedTypes.add(type);
    else failedAssets.push(`${url.pathname}:${response.status()}`);
  });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entra para cuidar el plan de casa." })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(loadedTypes).toEqual(new Set(["css", "js"]));
  expect(failedAssets).toEqual([]);
});

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

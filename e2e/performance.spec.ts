import { expect, test } from "@playwright/test";

test("foundation shell stays within the local navigation budget", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const firstContentfulPaint = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      firstContentfulPaint,
    };
  });

  console.log(`Foundation navigation metrics: ${JSON.stringify(metrics)}`);
  expect(metrics.domContentLoaded).toBeLessThan(2500);
});

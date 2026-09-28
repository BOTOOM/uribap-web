import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Playwright web server mode", () => {
  it(
    "packages static assets and uses standalone only in CI",
    async () => {
      vi.stubEnv("CI", "true");
      vi.resetModules();
      const ciConfig = (await import("../../playwright.config")).default;
      expect(ciConfig.webServer).toMatchObject({
        command: [
          "mkdir -p .next/standalone/.next/static .next/standalone/public",
          "cp -R .next/static/. .next/standalone/.next/static/",
          "cp -R public/. .next/standalone/public/",
          "node .next/standalone/server.js",
        ].join(" && "),
      });

      vi.stubEnv("CI", "");
      vi.resetModules();
      const localConfig = (await import("../../playwright.config")).default;
      expect(localConfig.webServer).toMatchObject({ command: "pnpm dev" });
    },
    30_000,
  );
});

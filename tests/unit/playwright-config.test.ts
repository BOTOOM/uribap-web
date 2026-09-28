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

describe("Next build output mode", () => {
  it("uses default output on Vercel and standalone when explicitly requested", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("URIBAP_NEXT_OUTPUT_MODE", "");
    vi.resetModules();
    const vercelConfig = (await import("../../next.config")).default;
    expect(vercelConfig.output).toBeUndefined();

    vi.stubEnv("VERCEL", "");
    vi.stubEnv("URIBAP_NEXT_OUTPUT_MODE", "standalone");
    vi.resetModules();
    const containerConfig = (await import("../../next.config")).default;
    expect(containerConfig.output).toBe("standalone");
  });
});

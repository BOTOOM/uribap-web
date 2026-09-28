import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Playwright web server mode", () => {
  it("uses the standalone production server in CI", async () => {
    vi.stubEnv("CI", "true");

    const config = (await import("../../playwright.config")).default;

    expect(config.webServer).toMatchObject({ command: "node .next/standalone/server.js" });
  });

  it("keeps Next dev for local browser tests", async () => {
    vi.stubEnv("CI", "");

    const config = (await import("../../playwright.config")).default;

    expect(config.webServer).toMatchObject({ command: "pnpm dev" });
  });
});

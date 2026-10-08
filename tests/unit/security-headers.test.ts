import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "../../next.config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function readCspFor(nodeEnv: "development" | "production") {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.resetModules();
  const config = (await import("../../next.config")).default;
  const groups = await config.headers?.();
  return groups?.[0].headers.find(
    (entry) => entry.key === "Content-Security-Policy",
  )?.value;
}

describe("security headers configuration", () => {
  it("applies baseline headers to every route", async () => {
    const groups = await nextConfig.headers?.();
    expect(groups).toHaveLength(4);
    const group = groups?.[0];
    expect(group?.source).toBe("/(.*)");

    const headers = new Map(group?.headers.map((entry) => [entry.key, entry.value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("keeps the CSP same-origin for fetches and denies framing", async () => {
    const groups = await nextConfig.headers?.();
    const csp = groups?.[0].headers.find(
      (entry) => entry.key === "Content-Security-Policy",
    )?.value;

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' http://localhost:8010");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("allows eval for React development diagnostics but not in production", async () => {
    const developmentCsp = await readCspFor("development");
    expect(developmentCsp).toContain("'unsafe-eval'");

    const productionCsp = await readCspFor("production");
    expect(productionCsp).not.toContain("'unsafe-eval'");
  });

  it("marks document routes as non-cacheable but spares static assets", async () => {
    const groups = await nextConfig.headers?.();
    const group = groups?.[1];
    expect(group?.source).toContain("_next/static");

    const cacheControl = group?.headers.find(
      (entry) => entry.key === "Cache-Control",
    )?.value;
    expect(cacheControl).toContain("no-store");
    expect(cacheControl).toContain("private");
  });

  it("overrides the referrer policy on invitation handoff and acceptance routes", async () => {
    const groups = await nextConfig.headers?.();

    for (const source of ["/api/invitations/hold", "/invitations/accept"]) {
      const group = groups?.find((candidate) => candidate.source === source);
      expect(group?.headers).toContainEqual({
        key: "Referrer-Policy",
        value: "no-referrer",
      });
    }
  });
});

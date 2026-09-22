import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("security headers configuration", () => {
  it("applies baseline headers to every route", async () => {
    const groups = await nextConfig.headers?.();
    expect(groups).toHaveLength(2);
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
});

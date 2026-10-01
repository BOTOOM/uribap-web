import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/invitations/hold/route";

describe("invitation token handoff route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores the token in a short-lived secure cookie and redirects without the token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await GET(
      new Request(
        "https://uribap.example.test/api/invitations/hold?token=synthetic%2Binvitation",
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "https://uribap.example.test/login?returnTo=/invitations/accept",
    );
    expect(response.headers.get("Location")).not.toContain("synthetic");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const cookie = response.headers.getSetCookie().find((value) =>
      value.startsWith("uribap_invitation_token="),
    );
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/(?:^|;)\s*HttpOnly(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*SameSite=Lax(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Path=\//i);
    expect(cookie).toMatch(/(?:^|;)\s*Max-Age=3600(?:;|$)/i);
  });

  it("does not mark the cookie secure outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await GET(
      new Request("http://localhost:3000/api/invitations/hold?token=synthetic"),
    );
    const cookie = response.headers.getSetCookie().find((value) =>
      value.startsWith("uribap_invitation_token="),
    );

    expect(response.status).toBe(303);
    expect(cookie).toBeDefined();
    expect(cookie).not.toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
  });

  it("rejects a missing token without setting the cookie", async () => {
    const response = await GET(
      new Request("https://uribap.example.test/api/invitations/hold"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});

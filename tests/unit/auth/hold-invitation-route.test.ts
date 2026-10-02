import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/invitations/hold/route";

const FLOW_ONE = "123e4567-e89b-42d3-a456-426614174000";
const FLOW_TWO = "123e4567-e89b-42d3-a456-426614174001";
const TOKEN = "synthetic_invitation-token_123";
const randomUUIDMock = vi.fn();

function holdRequest(token = TOKEN) {
  return new Request(
    `https://uribap.example.test/api/invitations/hold?token=${encodeURIComponent(token)}`,
  );
}

function heldCookie(response: Response, flow: string) {
  return response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`uribap_invitation_token_${flow}=`));
}

describe("invitation token handoff route", () => {
  beforeEach(() => {
    randomUUIDMock.mockReset();
    vi.stubGlobal("crypto", { randomUUID: randomUUIDMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sets a per-flow cookie for 168 hours and redirects without the token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    randomUUIDMock.mockReturnValue(FLOW_ONE);
    const response = await GET(holdRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      `https://uribap.example.test/invitations/accept?flow=${FLOW_ONE}`,
    );
    expect(response.headers.get("Location")).not.toContain(TOKEN);
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const cookie = heldCookie(response, FLOW_ONE);
    expect(cookie).toContain(`uribap_invitation_token_${FLOW_ONE}=${TOKEN}`);
    expect(cookie).toMatch(/(?:^|;)\s*HttpOnly(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*SameSite=Lax(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Path=\//i);
    expect(cookie).toMatch(/(?:^|;)\s*Max-Age=604800(?:;|$)/i);
  });

  it("does not mark the cookie secure outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    randomUUIDMock.mockReturnValue(FLOW_ONE);
    const response = await GET(holdRequest());
    const cookie = heldCookie(response, FLOW_ONE);

    expect(response.status).toBe(303);
    expect(cookie).toBeDefined();
    expect(cookie).not.toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
  });

  it("creates separate flow cookies for invitations opened in separate tabs", async () => {
    randomUUIDMock.mockReturnValueOnce(FLOW_ONE).mockReturnValueOnce(FLOW_TWO);

    const first = await GET(holdRequest());
    const second = await GET(holdRequest());

    expect(heldCookie(first, FLOW_ONE)).toBeDefined();
    expect(heldCookie(second, FLOW_TWO)).toBeDefined();
    expect(first.headers.get("Location")).toContain(`flow=${FLOW_ONE}`);
    expect(second.headers.get("Location")).toContain(`flow=${FLOW_TWO}`);
  });

  it.each(["short", "invalid+invitation-token_123", "x".repeat(257)])(
    "rejects an invalid token %j without setting a cookie",
    async (token) => {
      const response = await GET(holdRequest(token));

      expect(response.status).toBe(400);
      expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("Set-Cookie")).toBeNull();
    },
  );

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

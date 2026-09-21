import type { Account, Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jwtCallback, sessionCallback } from "@/lib/auth/callbacks";

const account = {
  type: "oidc",
  provider: "zitadel",
  providerAccountId: "subject",
  access_token: "header.payload.signature",
  refresh_token: "refresh-token",
  id_token: "header.payload.id",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "Bearer",
} as Account;

function apiUserResponse() {
  return new Response(
    JSON.stringify({
      id: "user-1",
      emailVerified: true,
      memberships: [
        { household_id: "house-1", household_name: "Casa", role: "owner", status: "active" },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("Auth.js callbacks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps provider tokens out of the public session", () => {
    const session = {
      user: { name: "Person", email: "person@example.test", image: null },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Session;
    const publicSession = sessionCallback({
      session,
      token: {
        accessToken: "private-access-token",
        refreshToken: "private-refresh-token",
        idToken: "private-id-token",
        internalUserId: "user-1",
        emailVerified: true,
        memberships: [],
      },
    });
    expect(publicSession.user.id).toBe("user-1");
    expect(JSON.stringify(publicSession)).not.toContain("private-access-token");
    expect(JSON.stringify(publicSession)).not.toContain("private-refresh-token");
    expect(JSON.stringify(publicSession)).not.toContain("private-id-token");
  });

  it("provisions the API user on the initial provider callback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiUserResponse()));
    const token = await jwtCallback({
      token: {},
      account,
      profile: { sub: "subject", email_verified: true },
    });
    expect(token.internalUserId).toBe("user-1");
    expect(token.memberships?.[0].householdId).toBe("house-1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/me"),
      expect.objectContaining({ headers: { Authorization: "Bearer header.payload.signature" } }),
    );
  });

  it("refreshes an expired access token and reprovisions the API user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "new.access.token", expires_in: 3600 }), { status: 200 }),
      )
      .mockResolvedValueOnce(apiUserResponse());
    vi.stubGlobal("fetch", fetchMock);
    const token = await jwtCallback({
      token: {
        accessToken: "old.access.token",
        refreshToken: "refresh-token",
        accessTokenExpires: 0,
      },
    });
    expect(token.accessToken).toBe("new.access.token");
    expect(token.internalUserId).toBe("user-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

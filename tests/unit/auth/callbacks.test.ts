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

function apiUserResponse(emailVerified = false) {
  return new Response(
    JSON.stringify({
      id: "user-1",
      email: "api@example.test",
      email_verified: emailVerified,
      display_name: "API Person",
      memberships: [
        { household_id: "house-1", household_name: "Casa", role: "owner", status: "active" },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("Auth.js callbacks", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("AUTH_SECRET", "synthetic-auth-secret-for-refresh-tests-0123456789");
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
      token: { email: "provider@example.test", name: "Provider Person" },
      account,
      profile: { sub: "subject", email_verified: true },
    });
    if (!token) throw new Error("Expected API session provisioning to return a JWT.");
    expect(token.internalUserId).toBe("user-1");
    expect(token.email).toBe("api@example.test");
    expect(token.name).toBe("API Person");
    expect(token.emailVerified).toBe(false);
    expect(token.memberships?.[0].householdId).toBe("house-1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/me"),
      expect.objectContaining({ headers: { Authorization: "Bearer header.payload.signature" } }),
    );
  });

  it("clears failure state and records the provider authentication time", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiUserResponse()));
    const authenticatedAt = Math.floor(Date.now() / 1000) - 5;
    const idToken = `header.${Buffer.from(JSON.stringify({ auth_time: authenticatedAt })).toString("base64url")}.signature`;

    const token = await jwtCallback({
      token: {
        error: "RefreshAccessTokenError",
        refreshFailureFingerprint: "stale-fingerprint",
      },
      account: { ...account, id_token: idToken },
      profile: { sub: "subject" },
    });

    if (!token) throw new Error("Expected a newly authenticated session.");
    expect(token.error).toBeUndefined();
    expect(token.refreshFailureFingerprint).toBeUndefined();
    expect(token.authenticatedAt).toBe(authenticatedAt * 1000);
    expect(token.refreshSessionEpoch).toEqual(expect.any(String));
  });

  it("invalidates an initial provider callback without an access token", async () => {
    const result = await jwtCallback({
      token: {},
      account: { ...account, access_token: undefined },
    });
    expect(result).toBeNull();
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
        refreshSessionEpoch: "old-refresh-session-epoch",
        authenticatedAt: 1_700_000_000_000,
      },
    });
    if (!token) throw new Error("Expected refreshed access token.");
    expect(token.accessToken).toBe("new.access.token");
    expect(token.internalUserId).toBe("user-1");
    expect(token.authenticatedAt).toBe(1_700_000_000_000);
    expect(token.refreshSessionEpoch).not.toBe("old-refresh-session-epoch");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("records authentication time and a private session generation from the validated ID token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiUserResponse()));
    const authenticatedAt = Math.floor(Date.now() / 1000) - 10;
    const idToken = `header.${Buffer.from(JSON.stringify({ auth_time: authenticatedAt })).toString("base64url")}.signature`;

    const token = await jwtCallback({
      token: {},
      account: { ...account, id_token: idToken },
      profile: { sub: "subject" },
    });

    if (!token) throw new Error("Expected API session provisioning to return a JWT.");
    expect(token.authenticatedAt).toBe(authenticatedAt * 1000);
    expect(token.refreshSessionEpoch).toEqual(expect.any(String));
  });

  it("fails closed after a rejected refresh and does not retry the same refresh generation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const token = await jwtCallback({
      token: {
        accessToken: "expired.access-token",
        refreshToken: "rejected.refresh-token",
        accessTokenExpires: 0,
        authenticatedAt: Date.now() - 60_000,
        refreshSessionEpoch: "refresh-epoch",
        internalUserId: "user-1",
        emailVerified: true,
        memberships: [{ householdId: "house-1", householdName: "Casa", role: "owner", status: "active" }],
      },
    });

    if (!token) throw new Error("Expected refresh failure state to remain encrypted server-side.");
    expect(token.error).toBe("RefreshAccessTokenError");
    expect(token.refreshFailureFingerprint).toEqual(expect.any(String));
    expect(token.refreshFailureFingerprint).not.toContain("rejected.refresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const session = sessionCallback({
      session: {
        user: { id: "user-1", name: "Person", email: "person@example.test", image: null, emailVerified: true, memberships: [] },
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as Session,
      token,
    });
    expect(session.error).toBe("RefreshAccessTokenError");
    expect(session.user.id).toBe("");
    expect(session.user.emailVerified).toBe(false);
    expect(session.user.memberships).toEqual([]);

    await jwtCallback({ token });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

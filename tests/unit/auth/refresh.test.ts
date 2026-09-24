import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CLIENT_ID = "client:é+&=";
const CLIENT_SECRET = "secret:ñ+&=";
const AUTH_SECRET = "synthetic-auth-secret-for-refresh-test-012345";

function apiUserResponse() {
  return new Response(
    JSON.stringify({
      id: "user-1",
      email: "api@example.test",
      email_verified: false,
      display_name: "API Person",
      memberships: [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

async function loadCallbacks() {
  vi.stubEnv("AUTH_ZITADEL_ID", CLIENT_ID);
  vi.stubEnv("AUTH_ZITADEL_SECRET", CLIENT_SECRET);
  vi.stubEnv("AUTH_ZITADEL_ISSUER", "https://issuer.example.test");
  vi.stubEnv("URIBAP_API_INTERNAL_URL", "https://api.example.test/api/v1");
  vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
  vi.resetModules();
  return import("@/lib/auth/callbacks");
}

const expiredToken = {
  accessToken: "old-access-token",
  refreshToken: "old-refresh-token",
  idToken: "old-id-token",
  accessTokenExpires: 0,
  email: "old@example.test",
  name: "Old Person",
  emailVerified: true,
  memberships: [],
};

describe("Auth.js token refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses RFC form Basic credentials and rotates returned tokens", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "new-access-token",
            expires_in: 3600,
            refresh_token: "new-refresh-token",
            id_token: "new-id-token",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(apiUserResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    const refreshed = await jwtCallback({ token: { ...expiredToken } });

    expect(refreshed?.accessToken).toBe("new-access-token");
    expect(refreshed?.refreshToken).toBe("new-refresh-token");
    expect(refreshed?.idToken).toBe("new-id-token");
    expect(refreshed?.email).toBe("api@example.test");
    expect(refreshed?.name).toBe("API Person");
    expect(refreshed?.emailVerified).toBe(false);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://issuer.example.test/oauth/v2/token");
    const formEncode = (value: string) => new URLSearchParams({ value }).toString().slice(6);
    const credentials = Buffer.from(
      `${formEncode(CLIENT_ID)}:${formEncode(CLIENT_SECRET)}`,
    ).toString("base64");
    expect(init.headers).toMatchObject({
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = String(init.body);
    expect([...new URLSearchParams(body).keys()].sort()).toEqual([
      "grant_type",
      "refresh_token",
    ]);
    expect(body).not.toContain(CLIENT_ID);
    expect(body).not.toContain(CLIENT_SECRET);
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("error");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(timeout).toHaveBeenCalledWith(5000);
  });

  it("retains previous refresh and ID tokens when rotation omits them", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "new-access-token", expires_in: 3600 }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(apiUserResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    const refreshed = await jwtCallback({ token: { ...expiredToken } });

    expect(refreshed?.refreshToken).toBe("old-refresh-token");
    expect(refreshed?.idToken).toBe("old-id-token");
  });

  it("returns an unexpired token unchanged without a refresh request", async () => {
    const token = { ...expiredToken, accessTokenExpires: Date.now() + 120_000 };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    await expect(jwtCallback({ token })).resolves.toBe(token);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invalidates a token with no refresh credential", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    await expect(jwtCallback({ token: { ...expiredToken, refreshToken: undefined } })).resolves.toBe(
      null,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["HTTP 400", () => Promise.resolve(new Response("private provider body", { status: 400 }))],
    ["network failure", () => Promise.reject(new Error("private transport details"))],
    ["invalid JSON", () => Promise.resolve(new Response("private provider body", { status: 200 }))],
  ])("invalidates the session after %s", async (_label, fetchResult) => {
    const fetchMock = vi.fn().mockImplementation(fetchResult);
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    await expect(jwtCallback({ token: { ...expiredToken } })).resolves.toBeNull();
  });

  it.each([
    { access_token: "", expires_in: 3600 },
    { access_token: "valid-access", expires_in: 0 },
    { access_token: "valid-access", expires_in: null },
    { access_token: "valid-access", expires_in: 3600, refresh_token: "" },
    { access_token: "valid-access", expires_in: 3600, refresh_token: 7 },
    { access_token: "valid-access", expires_in: 3600, id_token: "" },
    { access_token: "valid-access", expires_in: 3600, id_token: {} },
  ])("rejects malformed successful token response %j", async (payload) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { jwtCallback } = await loadCallbacks();

    await expect(jwtCallback({ token: { ...expiredToken } })).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

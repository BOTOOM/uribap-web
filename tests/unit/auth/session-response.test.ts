import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LOGOUT_EPOCH_COOKIE,
  preserveConcurrentSession,
  protectedCookieName,
  readLogoutEpoch,
  signLogoutEpoch,
} from "@/lib/auth/session-response";

const mocks = vi.hoisted(() => ({
  nextAuth: vi.fn(),
  zitadel: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("next-auth", () => ({ default: mocks.nextAuth }));
vi.mock("next-auth/providers/zitadel", () => ({ default: mocks.zitadel }));

const staleCookie =
  "__Secure-authjs.session-token=old; __Secure-authjs.session-token.0=old-0; __Secure-authjs.session-token.1=old-1; authjs.csrf-token=old-csrf";

function sessionRequest(
  method = "GET",
  path = "/api/auth/session",
  cookie = staleCookie,
): NextRequest {
  return new NextRequest(`https://web.example.test${path}`, {
    method,
    headers: { cookie },
  });
}

function response(payload: unknown, cookies: string[] = []): Response {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(payload), { status: 200, headers });
}

function failedSessionResponse(): Response {
  return response(
    { user: null },
    [
      "__Secure-authjs.session-token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
      "__Secure-authjs.session-token.0=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
      "__Secure-authjs.session-token.1=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
      "authjs.csrf-token=rotated-csrf; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax",
    ],
  );
}

function successfulSessionResponse(): Response {
  return response(
    { user: { id: "user-1" } },
    [
      "__Secure-authjs.session-token.0=fresh-0; Path=/; Secure; HttpOnly; SameSite=Lax",
      "__Secure-authjs.session-token.1=fresh-1; Path=/; Secure; HttpOnly; SameSite=Lax",
    ],
  );
}

function applySetCookieEffects(response: Response, jar: Map<string, string>): void {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (!value || /(?:^|;)\s*max-age=0(?:;|$)/i.test(cookie)) jar.delete(name);
    else jar.set(name, value);
  }
}

function initialJar(): Map<string, string> {
  return new Map([
    ["__Secure-authjs.session-token", "old"],
    ["__Secure-authjs.session-token.0", "old-0"],
    ["__Secure-authjs.session-token.1", "old-1"],
    ["authjs.csrf-token", "old-csrf"],
  ]);
}

describe("session marker signatures", () => {
  const secret = "synthetic-auth-secret-for-session-marker-tests-0123456789";

  it("rejects tampered, future, expired and malformed logout markers", () => {
    const timestamp = Date.now() - 1000;
    const marker = signLogoutEpoch(timestamp, secret);

    expect(marker).toBeDefined();
    expect(readLogoutEpoch(marker, secret)).toBe(timestamp);
    expect(readLogoutEpoch(`${timestamp}.${"A".repeat(43)}`, secret)).toBeUndefined();
    expect(readLogoutEpoch(signLogoutEpoch(Date.now() + 120_000, secret), secret)).toBeUndefined();
    expect(
      readLogoutEpoch(signLogoutEpoch(Date.now() - 31 * 24 * 60 * 60 * 1000, secret), secret),
    ).toBeUndefined();
    expect(readLogoutEpoch(undefined, secret)).toBeUndefined();
  });
});

describe("concurrent Auth.js session responses", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.nextAuth.mockReset().mockReturnValue({
      handlers: { GET: mocks.get, POST: mocks.post },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    mocks.zitadel.mockReset().mockReturnValue({ id: "zitadel" });
  });

  it("preserves a fresh chunked session when failed and successful responses race", async () => {
    const request = sessionRequest();
    const [failed, successful] = await Promise.all([
      preserveConcurrentSession(request, failedSessionResponse()),
      preserveConcurrentSession(request, successfulSessionResponse()),
    ]);

    expect(await failed.clone().json()).toEqual({ user: null });
    const failedCookies = failed.headers.getSetCookie();
    expect(failedCookies.some((cookie) => /authjs\.session-token/.test(cookie))).toBe(false);
    expect(failedCookies).toContain(
      "authjs.csrf-token=rotated-csrf; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax",
    );

    for (const order of [
      [successful, failed],
      [failed, successful],
    ]) {
      const jar = initialJar();
      for (const result of order) applySetCookieEffects(result, jar);
      expect(jar.get("__Secure-authjs.session-token.0")).toBe("fresh-0");
      expect(jar.get("__Secure-authjs.session-token.1")).toBe("fresh-1");
      expect(jar.get("authjs.csrf-token")).toBe("rotated-csrf");
    }
  });

  it("keeps a rejected refresh out of the Auth.js session cookie and records a retry marker", async () => {
    const fingerprint = "A".repeat(43);
    const guarded = await preserveConcurrentSession(
      sessionRequest(),
      response(
        { user: { id: "" }, error: "RefreshAccessTokenError", refreshFailureFingerprint: fingerprint },
        ["__Secure-authjs.session-token.0=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax"],
      ),
    );

    const cookies = guarded.headers.getSetCookie();
    expect(cookies.some((cookie) => /authjs\.session-token/.test(cookie))).toBe(false);
    const marker = cookies.find((cookie) => cookie.startsWith("__Secure-uribap-refresh-failure="));
    expect(marker).toContain(`=${fingerprint};`);
    expect(marker).toContain("HttpOnly");
    expect(marker).toContain("Secure");
    expect(marker).toContain("Path=/");
    expect(await guarded.clone().json()).toMatchObject({ error: "RefreshAccessTokenError" });
  });

  it("clears an old refresh marker only when a fresh session generation is returned", async () => {
    const previous = "A".repeat(43);
    const current = "B".repeat(43);
    const request = sessionRequest(
      "GET",
      "/api/auth/session",
      `${staleCookie}; __Secure-uribap-refresh-failure=${previous}`,
    );
    const guarded = await preserveConcurrentSession(
      request,
      response(
        { user: { id: "user-1" }, refreshSessionFingerprint: current },
        ["__Secure-authjs.session-token.0=fresh; Path=/; Secure; HttpOnly; SameSite=Lax"],
      ),
    );

    expect(guarded.headers.getSetCookie()).toContain(
      "__Secure-uribap-refresh-failure=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
    );
  });

  it("does not return a pre-logout session from the public Auth.js session handler", async () => {
    const secret = "synthetic-auth-secret-for-session-marker-tests-0123456789";
    vi.stubEnv("AUTH_SECRET", secret);
    const logoutAt = Date.now() - 1000;
    const marker = signLogoutEpoch(logoutAt, secret);
    if (!marker) throw new Error("Expected a signed test marker.");
    const { handlers } = await import("@/lib/auth/auth");
    mocks.get.mockResolvedValueOnce(successfulSessionResponse());

    const result = await handlers.GET(
      sessionRequest("GET", "/api/auth/session", `${staleCookie}; ${protectedCookieName(LOGOUT_EPOCH_COOKIE, true)}=${marker}`),
    );

    expect(await result.json()).toMatchObject({ user: null, error: "SessionInvalidated" });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("guards both exported handlers for failed session reads but leaves signout clears intact", async () => {
    const { handlers } = await import("@/lib/auth/auth");
    mocks.get.mockResolvedValueOnce(failedSessionResponse());
    mocks.post.mockResolvedValueOnce(failedSessionResponse()).mockResolvedValueOnce(failedSessionResponse());

    const getResponse = await handlers.GET(sessionRequest());
    const postSessionResponse = await handlers.POST(sessionRequest("POST", "/api/auth/session/"));
    const signoutResponse = await handlers.POST(sessionRequest("POST", "/api/auth/signout"));

    expect(getResponse.headers.getSetCookie().some((cookie) => /authjs\.session-token/.test(cookie))).toBe(false);
    expect(
      postSessionResponse.headers.getSetCookie().some((cookie) => /authjs\.session-token/.test(cookie)),
    ).toBe(false);
    expect(signoutResponse.headers.getSetCookie().some((cookie) => /authjs\.session-token/.test(cookie))).toBe(
      true,
    );
  });

  it("keeps explicit signout responses outside the session guard", async () => {
    const request = sessionRequest("POST", "/api/auth/signout");
    const original = failedSessionResponse();

    const guarded = await preserveConcurrentSession(request, original);

    expect(guarded).toBe(original);
    expect(guarded.headers.getSetCookie().some((cookie) => /authjs\.session-token/.test(cookie))).toBe(true);
  });

  it("filters session clearing from malformed failed responses when a session cookie was sent", async () => {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      "authjs.session-token.0=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    );
    headers.append("set-cookie", "authjs.csrf-token=next; Path=/; HttpOnly; SameSite=Lax");
    const original = new Response("not-json", { headers });

    const guarded = await preserveConcurrentSession(sessionRequest(), original);

    expect(await guarded.text()).toBe("not-json");
    expect(guarded.headers.getSetCookie()).toEqual([
      "authjs.csrf-token=next; Path=/; HttpOnly; SameSite=Lax",
    ]);
  });

  it("leaves no-cookie requests and valid sessions unchanged", async () => {
    const noCookieResponse = failedSessionResponse();
    const noCookie = await preserveConcurrentSession(
      sessionRequest("GET", "/api/auth/session", "authjs.csrf-token=old"),
      noCookieResponse,
    );
    const validResponse = response(
      { user: { id: "user-1" } },
      ["__Secure-authjs.session-token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax"],
    );
    const valid = await preserveConcurrentSession(sessionRequest(), validResponse);

    expect(noCookie).toBe(noCookieResponse);
    expect(valid).toBe(validResponse);
    expect(valid.headers.getSetCookie()).toHaveLength(1);
  });
});

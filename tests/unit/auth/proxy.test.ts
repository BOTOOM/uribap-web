import { createHmac } from "node:crypto";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionGet, getTokenMock } = vi.hoisted(() => ({ sessionGet: vi.fn(), getTokenMock: vi.fn() }));

vi.mock("@/lib/auth/auth", () => ({ handlers: { GET: sessionGet } }));
vi.mock("next-auth/jwt", () => ({ getToken: getTokenMock }));

import proxy from "@/proxy";

const AUTH_SECRET = "synthetic-auth-secret-for-refresh-tests-0123456789";

function hmac(value: string): string {
  return createHmac("sha256", AUTH_SECRET).update("refresh-state:").update(value).digest("base64url");
}

function sessionResponse(
  session: unknown,
  cookies: string[] = [],
  status = 200,
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(session), { status, headers });
}

describe("route protection proxy", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("AUTH_SECRET", "synthetic-auth-secret-for-refresh-tests-0123456789");
    vi.resetAllMocks();
  });

  it("forwards refreshed encrypted cookies into the downstream request", async () => {
    sessionGet.mockResolvedValue(
      sessionResponse(
        { user: { id: "user-1" } },
        [
          "__Secure-authjs.session-token.0=first%2Fpart; Path=/; HttpOnly; Secure; SameSite=Lax",
          "__Secure-authjs.session-token.1=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
          "__Secure-authjs.session-token.2=third; Path=/; HttpOnly; Secure; SameSite=Lax",
        ],
      ),
    );

    const response = await proxy(
      new NextRequest("https://uribap.example.test/plan?week=current", {
        headers: { cookie: "authjs.session-token=old; unrelated=keep" },
      }),
    );

    const internalRequest = sessionGet.mock.calls[0]?.[0] as Request;
    expect(new URL(internalRequest.url).pathname).toBe("/api/auth/session");
    expect(internalRequest.headers.get("authorization")).toBeNull();
    expect(internalRequest.headers.get("x-access-token")).toBeNull();
    expect(await internalRequest.text()).toBe("");
    const forwardedCookie = response.headers.get("x-middleware-request-cookie") ?? "";
    expect(forwardedCookie).toContain("__Secure-authjs.session-token.0=first%2Fpart");
    expect(forwardedCookie).toContain("__Secure-authjs.session-token.2=third");
    expect(forwardedCookie).not.toContain("__Secure-authjs.session-token.1=");
    expect(forwardedCookie).toContain("unrelated=keep");
    expect(response.headers.getSetCookie()).toHaveLength(3);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("redirects unauthenticated pages and returns JSON 401 for API requests", async () => {
    sessionGet.mockResolvedValue(sessionResponse({ user: null }));

    const pageResponse = await proxy(
      new NextRequest("https://uribap.example.test/plan?week=current"),
    );
    expect(pageResponse.status).toBe(307);
    const loginUrl = new URL(pageResponse.headers.get("Location") ?? "");
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("returnTo")).toBe("/plan?week=current");

    const apiResponse = await proxy(
      new NextRequest("https://uribap.example.test/api/me"),
    );
    expect(apiResponse.status).toBe(401);
    await expect(apiResponse.json()).resolves.toEqual({
      code: "unauthorized",
      detail: "Inicia sesión para continuar.",
    });
  });

  it("blocks a cookie generation after its refresh token was rejected without calling the provider again", async () => {
    const accessToken = "synthetic-expired-access-token";
    const refreshToken = "synthetic-rejected-refresh-token";
    const fingerprint = hmac(`${accessToken}\u0000${refreshToken}`);
    getTokenMock.mockResolvedValue({ accessToken, refreshToken });

    const response = await proxy(
      new NextRequest("https://uribap.example.test/plan", {
        headers: {
          cookie: `authjs.session-token=encrypted; __Secure-uribap-refresh-failure=${fingerprint}`,
        },
      }),
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("Location") ?? "").pathname).toBe("/login");
    expect(sessionGet).not.toHaveBeenCalled();
  });

  it("rejects refreshes from before logout and accepts a newly authenticated session", async () => {
    const logoutAt = Date.now() - 10_000;
    const logoutSignature = createHmac("sha256", AUTH_SECRET)
      .update(`uribap-auth-logout-before:${logoutAt}`)
      .digest("base64url");
    const logoutMarker = `${logoutAt}.${logoutSignature}`;
    const request = () =>
      new NextRequest("https://uribap.example.test/plan", {
        headers: { cookie: `__Secure-uribap-auth-logout-before=${logoutMarker}` },
      });
    sessionGet.mockResolvedValueOnce(
      sessionResponse({ user: { id: "old-user" }, authenticatedAt: logoutAt - 1 }),
    );
    sessionGet.mockResolvedValueOnce(
      sessionResponse(
        { user: { id: "new-user" }, authenticatedAt: logoutAt + 1 },
        ["__Secure-uribap-auth-logout-before=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax"],
      ),
    );

    const oldSession = await proxy(request());
    const newSession = await proxy(request());

    expect(oldSession.status).toBe(307);
    expect(new URL(oldSession.headers.get("Location") ?? "").pathname).toBe("/login");
    expect(newSession.headers.get("x-middleware-next")).toBe("1");
    expect(newSession.headers.getSetCookie()).toContain(
      "__Secure-uribap-auth-logout-before=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
    );
  });

  it("bypasses public health and Auth.js endpoints", async () => {
    const health = await proxy(new NextRequest("https://uribap.example.test/api/health"));
    const auth = await proxy(new NextRequest("https://uribap.example.test/api/auth/session"));

    expect(health.headers.get("x-middleware-next")).toBe("1");
    expect(auth.headers.get("x-middleware-next")).toBe("1");
    expect(sessionGet).not.toHaveBeenCalled();
  });

  it("forwards Auth.js cookie deletion when refresh fails", async () => {
    sessionGet.mockResolvedValue(
      sessionResponse({}, ["__Secure-authjs.session-token=; Path=/; Secure; Max-Age=0"], 503),
    );

    const response = await proxy(new NextRequest("https://uribap.example.test/plan"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "identity_provider_unavailable",
      detail: "No pudimos comprobar tu sesión.",
    });
    expect(response.headers.getSetCookie()).toEqual([
      "__Secure-authjs.session-token=; Path=/; Secure; Max-Age=0",
    ]);
  });

  it("returns a redacted unavailable response when the Auth.js handler throws", async () => {
    sessionGet.mockRejectedValue(new Error("private provider response"));

    const response = await proxy(new NextRequest("https://uribap.example.test/plan"));

    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).not.toContain("private provider response");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

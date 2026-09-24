import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionGet } = vi.hoisted(() => ({ sessionGet: vi.fn() }));

vi.mock("@/lib/auth/auth", () => ({ handlers: { GET: sessionGet } }));

import proxy from "@/proxy";

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

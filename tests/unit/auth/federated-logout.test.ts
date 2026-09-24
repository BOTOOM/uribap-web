import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTokenMock, cookiesMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({ getToken: getTokenMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

const APP_ORIGIN = "https://uribap.example.test";
const COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "__Secure-authjs.session-token.0",
  "__Secure-authjs.session-token.1",
  "authjs.session-token",
  "authjs.session-token.0",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

async function loadLogoutRoute() {
  vi.stubEnv("AUTH_URL", APP_ORIGIN);
  vi.stubEnv("AUTH_SECRET", "synthetic-auth-secret-for-logout-test-012345");
  vi.stubEnv("AUTH_ZITADEL_ISSUER", "https://issuer.example.test");
  vi.resetModules();
  return import("@/app/api/auth/federated-logout/route");
}

function cookieStore() {
  return {
    getAll: () => [
      ...COOKIE_NAMES.map((name) => ({ name, value: "synthetic-cookie" })),
      { name: "unrelated", value: "preserve" },
    ],
  };
}

describe("federated logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cookiesMock.mockResolvedValue(cookieStore());
    getTokenMock.mockResolvedValue({ idToken: "synthetic-id-token" });
  });

  it.each([undefined, "https://attacker.example.test"])(
    "rejects missing or foreign Origin %s before reading cookies",
    async (origin) => {
      const { POST } = await loadLogoutRoute();
      const headers = new Headers();
      if (origin) headers.set("Origin", origin);
      const response = await POST(
        new Request(`${APP_ORIGIN}/api/auth/federated-logout`, { method: "POST", headers }),
      );

      expect(response.status).toBe(403);
      expect(cookiesMock).not.toHaveBeenCalled();
      expect(getTokenMock).not.toHaveBeenCalled();
      expect(response.headers.get("Set-Cookie")).toBeNull();
    },
  );

  it("redirects to canonical provider logout and expires every session chunk", async () => {
    const { POST } = await loadLogoutRoute();
    const response = await POST(
      new Request(`${APP_ORIGIN}/api/auth/federated-logout`, {
        method: "POST",
        headers: {
          Origin: APP_ORIGIN,
          Cookie: "__Secure-authjs.session-token.0=encrypted; unrelated=preserve",
          "X-Forwarded-Proto": "https, http",
          Authorization: "Bearer must-not-be-used",
        },
      }),
    );

    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("Location") ?? "");
    expect(location.origin).toBe("https://issuer.example.test");
    expect(location.pathname).toBe("/oidc/v1/end_session");
    expect(location.searchParams.get("post_logout_redirect_uri")).toBe(`${APP_ORIGIN}/`);
    expect(location.searchParams.get("id_token_hint")).toBe("synthetic-id-token");

    const options = getTokenMock.mock.calls[0]?.[0] as {
      req: Request;
      secureCookie: boolean;
    };
    expect(options.secureCookie).toBe(true);
    expect(options.req.headers.get("cookie")).toContain("__Secure-authjs.session-token.0=encrypted");
    expect(options.req.headers.get("authorization")).toBeNull();

    const deletedCookies = response.headers.getSetCookie();
    expect(deletedCookies).toHaveLength(COOKIE_NAMES.length);
    for (const name of COOKIE_NAMES) {
      const header = deletedCookies.find((cookie) => cookie.startsWith(`${name}=`));
      expect(header).toBeDefined();
      expect(header).toMatch(/(?:^|;)\s*Path=\//i);
      expect(header).toMatch(/(?:^|;)\s*HttpOnly(?:;|$)/i);
      expect(header).toMatch(/(?:^|;)\s*SameSite=Lax(?:;|$)/i);
      expect(header).toMatch(/(?:^|;)\s*Max-Age=0(?:;|$)/i);
      expect(/(?:^|;)\s*Secure(?:;|$)/i.test(header ?? "")).toBe(name.startsWith("__Secure-"));
    }
    expect(deletedCookies.some((cookie) => cookie.startsWith("unrelated="))).toBe(false);
  });
});

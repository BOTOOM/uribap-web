import { webcrypto } from "node:crypto";

import { encode } from "next-auth/jwt";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InvitationAcceptPage from "@/app/(public)/invitations/accept/page";
import { LOGOUT_EPOCH_COOKIE, signLogoutEpoch } from "@/lib/auth/session-response";

const { cookiesMock, headersMock, authMock, redirectMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({ auth: authMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock, headers: headersMock }));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const AUTH_SECRET = "synthetic-auth-secret-for-server-client-012345";
const COOKIE_NAME = "__Secure-authjs.session-token";
let cookieHeader = "";

async function setSessionCookie(
  accessTokenExpires: number | undefined,
  additionalClaims: Record<string, unknown> = {},
) {
  const encrypted = await encode({
    token: {
      accessToken: "server-access-token",
      accessTokenExpires,
      ...additionalClaims,
    },
    secret: AUTH_SECRET,
    salt: COOKIE_NAME,
  });
  const boundary = Math.floor(encrypted.length / 2);
  cookieHeader = [
    `${COOKIE_NAME}.0=${encrypted.slice(0, boundary)}`,
    `${COOKIE_NAME}.1=${encrypted.slice(boundary)}`,
  ].join("; ");
}

async function loadServerClient() {
  vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
  vi.stubEnv("URIBAP_API_INTERNAL_URL", "https://api.example.test/api/v1");
  vi.resetModules();
  return import("@/lib/api/server-client");
}

describe("server API access token boundary", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", webcrypto);
    cookieHeader = "";
    cookiesMock.mockResolvedValue({
      toString: () => cookieHeader,
      get: (name: string) => {
        const prefix = `${name}=`;
        const pair = cookieHeader.split(/;\s*/).find((value) => value.startsWith(prefix));
        return pair ? { name, value: pair.slice(prefix.length) } : undefined;
      },
    });
    headersMock.mockResolvedValue(new Headers({ "x-forwarded-proto": "https, http" }));
    authMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((target: string) => {
      throw new Error(`${target}:redirected to login`);
    });
  });

  it("reads a real encrypted HTTPS chunked cookie and injects its token server-side", async () => {
    await setSessionCookie(Date.now() + 60_000);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", memberships: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { serverApiFetch } = await loadServerClient();

    await serverApiFetch("/me");

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: "Bearer server-access-token" });
    expect(headersMock).toHaveBeenCalledOnce();
  });

  it.each([undefined, Date.now() - 1])("rejects missing or expired token expiry %s", async (expiry) => {
    await setSessionCookie(expiry);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { serverApiFetch, ApiRequestError } = await loadServerClient();

    await expect(serverApiFetch("/me")).rejects.toBeInstanceOf(ApiRequestError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a session generation fenced by a same-second logout", async () => {
    const logoutAt = Math.floor(Date.now() / 1000) * 1000;
    const sessionEpoch = "session-logged-out";
    const marker = signLogoutEpoch(logoutAt, AUTH_SECRET, sessionEpoch);
    if (!marker) throw new Error("Expected a signed logout marker.");
    await setSessionCookie(Date.now() + 60_000, {
      authSessionEpoch: sessionEpoch,
      authenticatedAt: logoutAt,
    });
    cookieHeader += `; __Secure-${LOGOUT_EPOCH_COOKIE}=${marker}`;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { serverApiFetch } = await loadServerClient();

    await expect(serverApiFetch("/me")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores an incoming invitation token before redirecting to login", async () => {
    authMock.mockResolvedValue({
      user: { id: "", name: null, email: null, image: null },
      error: "RefreshAccessTokenError",
    });

    await expect(
      InvitationAcceptPage({ searchParams: Promise.resolve({ token: "synthetic-invitation" }) }),
    ).rejects.toThrow(
      "/api/invitations/hold?token=synthetic-invitation:redirected to login",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/api/invitations/hold?token=synthetic-invitation",
    );
  });

  it("uses the cookie token when the acceptance page has no query token", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    cookieHeader = "uribap_invitation_token=held-invitation";

    const page = await InvitationAcceptPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByLabelText("Código de invitación")).toHaveValue("held-invitation");
  });

  it("prefers the query token over the cookie token", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    cookieHeader = "uribap_invitation_token=held-invitation";

    const page = await InvitationAcceptPage({
      searchParams: Promise.resolve({ token: "query-invitation" }),
    });
    render(page);

    expect(screen.getByLabelText("Código de invitación")).toHaveValue("query-invitation");
  });

  it("keeps the invitation token out of the login return target when none is available", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      InvitationAcceptPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("/login?returnTo=%2Finvitations%2Faccept:redirected to login");
  });

  it("rejects a request without an encrypted session cookie", async () => {
    cookieHeader = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { serverApiFetch } = await loadServerClient();

    await expect(serverApiFetch("/me")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

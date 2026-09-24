import { beforeEach, describe, expect, it, vi } from "vitest";

const { nextAuthMock, zitadelMock } = vi.hoisted(() => ({
  nextAuthMock: vi.fn(),
  zitadelMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ default: nextAuthMock }));
vi.mock("next-auth/providers/zitadel", () => ({ default: zitadelMock }));

describe("Auth.js ZITADEL configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    nextAuthMock.mockReturnValue({
      handlers: { GET: vi.fn(), POST: vi.fn() },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    zitadelMock.mockReturnValue({ id: "zitadel" });
  });

  it("uses Basic token endpoint authentication and explicit OIDC checks", async () => {
    await import("@/lib/auth/auth");

    expect(zitadelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client: { token_endpoint_auth_method: "client_secret_basic" },
        checks: ["pkce", "state", "nonce"],
        authorization: { params: expect.objectContaining({ ui_locales: "es" }) },
      }),
    );
  });
});

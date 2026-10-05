import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  serverApiFetch: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/api/server-client", () => ({
  serverApiFetch: mocks.serverApiFetch,
}));

import { POST } from "@/app/api/invitations/accept/route";
import { invitationTokenCookieName } from "@/lib/auth/invitation-token-cookie";

const FLOW_ONE = "123e4567-e89b-42d3-a456-426614174000";
const FLOW_TWO = "123e4567-e89b-42d3-a456-426614174001";
const TOKEN_ONE = "synthetic_invitation-token_123";
const TOKEN_TWO = "another_invitation-token_456";

function acceptRequest(payload: unknown) {
  return new Request("https://uribap.example.test/api/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function flowCookie(response: Response, flow: string) {
  return response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${invitationTokenCookieName(flow)}=`));
}

describe("invitation acceptance BFF route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mocks.cookies.mockReset().mockResolvedValue({ get: vi.fn() });
    mocks.serverApiFetch.mockReset();
  });

  it("reads and clears only the cookie for the requested flow after acceptance", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const getCookie = vi.fn((name: string) => {
      if (name === invitationTokenCookieName(FLOW_ONE)) {
        return { name, value: TOKEN_ONE };
      }
      if (name === invitationTokenCookieName(FLOW_TWO)) {
        return { name, value: TOKEN_TWO };
      }
      return undefined;
    });
    mocks.cookies.mockResolvedValue({ get: getCookie });
    mocks.serverApiFetch.mockResolvedValue({ household_id: "household-1" });

    const response = await POST(acceptRequest({ flow: FLOW_ONE }));

    expect(response.status).toBe(200);
    expect(getCookie).toHaveBeenCalledWith(invitationTokenCookieName(FLOW_ONE));
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token: TOKEN_ONE }),
    });
    expect(response.headers.getSetCookie()).toHaveLength(1);
    const cookie = flowCookie(response, FLOW_ONE);
    expect(cookie).toMatch(/(?:^|;)\s*HttpOnly(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*SameSite=Lax(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Path=\//i);
    expect(cookie).toMatch(/(?:^|;)\s*Max-Age=0(?:;|$)/i);
    expect(response.headers.getSetCookie()[0]).not.toContain(TOKEN_TWO);
  });

  it("returns 410 when the flow cookie is unavailable", async () => {
    const getCookie = vi.fn();
    mocks.cookies.mockResolvedValue({ get: getCookie });

    const response = await POST(acceptRequest({ flow: FLOW_ONE }));

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      code: "invitation_unavailable",
      detail: "La invitación ya no está disponible; abre de nuevo el enlace del correo.",
    });
    expect(getCookie).toHaveBeenCalledWith(invitationTokenCookieName(FLOW_ONE));
    expect(mocks.serverApiFetch).not.toHaveBeenCalled();
  });

  it("keeps the manual-token acceptance path", async () => {
    mocks.serverApiFetch.mockResolvedValue({ household_id: "household-1" });

    const response = await POST(acceptRequest({ token: TOKEN_ONE }));

    expect(response.status).toBe(200);
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token: TOKEN_ONE }),
    });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it.each([
    { token: "short" },
    { token: "invalid+invitation-token_123" },
    { flow: "not-a-uuid" },
    { flow: FLOW_ONE, token: TOKEN_ONE },
  ])("rejects invalid acceptance payloads %#", async (payload) => {
    const response = await POST(acceptRequest(payload));

    expect(response.status).toBe(400);
    expect(mocks.serverApiFetch).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    "clears only the matching flow cookie when the API returns %s",
    async (status) => {
      mocks.cookies.mockResolvedValue({
        get: vi.fn((name: string) =>
          name === invitationTokenCookieName(FLOW_ONE)
            ? { value: TOKEN_ONE }
            : undefined,
        ),
      });
      mocks.serverApiFetch.mockRejectedValue(
        Object.assign(new Error("Invitation expired"), {
          status,
          code: "invalid_invitation",
        }),
      );

      const response = await POST(acceptRequest({ flow: FLOW_ONE }));

      expect(response.status).toBe(status);
      expect(flowCookie(response, FLOW_ONE)).toMatch(
        /(?:^|;)\s*Max-Age=0(?:;|$)/i,
      );
      expect(response.headers.getSetCookie()).toHaveLength(1);
      expect(flowCookie(response, FLOW_TWO)).toBeUndefined();
    },
  );

  it("retains the flow cookie for retryable errors", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: TOKEN_ONE })),
    });
    mocks.serverApiFetch.mockRejectedValue(
      Object.assign(new Error("Unavailable"), {
        status: 503,
        code: "identity_provider_unavailable",
      }),
    );

    const response = await POST(acceptRequest({ flow: FLOW_ONE }));

    expect(response.status).toBe(503);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});

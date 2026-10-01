import { beforeEach, describe, expect, it, vi } from "vitest";

const { serverApiFetch } = vi.hoisted(() => ({ serverApiFetch: vi.fn() }));

vi.mock("@/lib/api/server-client", () => ({ serverApiFetch }));

import { POST } from "@/app/api/invitations/accept/route";

function acceptRequest(token = "synthetic-invitation") {
  return new Request("https://uribap.example.test/api/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

function invitationCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .find((value) => value.startsWith("uribap_invitation_token="));
}

describe("invitation acceptance BFF route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    serverApiFetch.mockReset();
  });

  it("clears the handoff cookie after successful acceptance", async () => {
    vi.stubEnv("NODE_ENV", "production");
    serverApiFetch.mockResolvedValue({ household_id: "household-1" });

    const response = await POST(acceptRequest());

    expect(response.status).toBe(200);
    const cookie = invitationCookie(response);
    expect(cookie).toMatch(/(?:^|;)\s*HttpOnly(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*SameSite=Lax(?:;|$)/i);
    expect(cookie).toMatch(/(?:^|;)\s*Path=\//i);
    expect(cookie).toMatch(/(?:^|;)\s*Max-Age=0(?:;|$)/i);
  });

  it.each([404, 410])("clears the handoff cookie for invalid-token status %s", async (status) => {
    serverApiFetch.mockRejectedValue(
      Object.assign(new Error("Invitation expired"), {
        status,
        code: "invalid_invitation",
      }),
    );

    const response = await POST(acceptRequest());

    expect(response.status).toBe(status);
    expect(invitationCookie(response)).toMatch(/(?:^|;)\s*Max-Age=0(?:;|$)/i);
  });

  it("retains the handoff cookie for retryable errors", async () => {
    serverApiFetch.mockRejectedValue(
      Object.assign(new Error("Unavailable"), {
        status: 503,
        code: "identity_provider_unavailable",
      }),
    );

    const response = await POST(acceptRequest());

    expect(response.status).toBe(503);
    expect(invitationCookie(response)).toBeUndefined();
  });
});

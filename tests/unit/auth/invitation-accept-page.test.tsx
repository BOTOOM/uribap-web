import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/auth", () => ({ auth: mocks.auth }));

import InvitationAcceptPage from "@/app/(public)/invitations/accept/page";
import { InvitationAcceptanceForm } from "@/components/household/InvitationAcceptanceForm";
import { invitationTokenCookieName } from "@/lib/auth/invitation-token-cookie";

const FLOW = "123e4567-e89b-42d3-a456-426614174000";
const TOKEN = "synthetic_invitation-token_123";

function findAcceptanceForm(node: ReactNode): ReactElement | undefined {
  if (!isValidElement(node)) return undefined;
  if (node.type === InvitationAcceptanceForm) return node;

  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Children.toArray(children)) {
    const form = findAcceptanceForm(child);
    if (form) return form;
  }
  return undefined;
}

describe("invitation acceptance page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    });
    mocks.cookies.mockResolvedValue({
      get: vi.fn(),
      has: vi.fn(() => false),
    });
  });

  it("moves a token query to the hold route before checking the session", async () => {
    await expect(
      InvitationAcceptPage({
        searchParams: Promise.resolve({ token: TOKEN, flow: FLOW }),
      }),
    ).rejects.toThrow(
      `NEXT_REDIRECT:/api/invitations/hold?token=${encodeURIComponent(TOKEN)}`,
    );

    expect(mocks.redirect).toHaveBeenCalledWith(
      `/api/invitations/hold?token=${encodeURIComponent(TOKEN)}`,
    );
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("passes only the flow and cookie-presence flag to the client form", async () => {
    const hasCookie = vi.fn(
      (name: string) => name === invitationTokenCookieName(FLOW),
    );
    const getCookie = vi.fn(() => ({ value: TOKEN }));
    mocks.cookies.mockResolvedValue({ get: getCookie, has: hasCookie });
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const page = await InvitationAcceptPage({
      searchParams: Promise.resolve({ flow: FLOW }),
    });
    const form = findAcceptanceForm(page);

    expect(hasCookie).toHaveBeenCalledWith(invitationTokenCookieName(FLOW));
    expect(form).toBeDefined();
    expect(form?.props).toEqual({ flow: FLOW, hasHeldInvitation: true });
    expect(JSON.stringify(form?.props)).not.toContain(TOKEN);
    expect(getCookie).not.toHaveBeenCalled();
  });

  it("returns to the token-free flow URL when login is required", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(
      InvitationAcceptPage({
        searchParams: Promise.resolve({ flow: FLOW }),
      }),
    ).rejects.toThrow(
      `NEXT_REDIRECT:/login?returnTo=${encodeURIComponent(`/invitations/accept?flow=${FLOW}`)}`,
    );
  });
});

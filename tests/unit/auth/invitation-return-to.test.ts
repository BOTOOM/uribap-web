import { describe, expect, it } from "vitest";

import { invitationLoginRedirect } from "@/lib/auth/invitation-return-to";

describe("invitationLoginRedirect", () => {
  it("holds a token before login instead of placing it in the return target", () => {
    expect(invitationLoginRedirect("code+with / chars")).toBe(
      "/api/invitations/hold?token=code%2Bwith%20%2F%20chars",
    );
  });

  it("uses the plain acceptance path when no token is present", () => {
    expect(invitationLoginRedirect()).toBe(
      "/login?returnTo=%2Finvitations%2Faccept",
    );
  });
});

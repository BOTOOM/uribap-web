import { describe, expect, it } from "vitest";

import { invitationLoginRedirect } from "@/lib/auth/invitation-return-to";

describe("invitationLoginRedirect", () => {
  it("preserves an encoded invitation token in the login return target", () => {
    expect(invitationLoginRedirect("code+with / chars")).toBe(
      "/login?returnTo=%2Finvitations%2Faccept%3Ftoken%3Dcode%252Bwith%2520%252F%2520chars",
    );
  });

  it("uses the plain acceptance path when no token is present", () => {
    expect(invitationLoginRedirect()).toBe(
      "/login?returnTo=%2Finvitations%2Faccept",
    );
  });
});

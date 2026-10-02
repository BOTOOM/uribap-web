import { describe, expect, it } from "vitest";

import { invitationLoginRedirect } from "@/lib/auth/invitation-return-to";

describe("invitationLoginRedirect", () => {
  it("includes only the validated flow in the login return target", () => {
    const flow = "123e4567-e89b-42d3-a456-426614174000";
    expect(invitationLoginRedirect(flow)).toBe(
      `/login?returnTo=${encodeURIComponent(`/invitations/accept?flow=${flow}`)}`,
    );
  });

  it("uses the plain acceptance path when no flow is present", () => {
    expect(invitationLoginRedirect()).toBe(
      "/login?returnTo=%2Finvitations%2Faccept",
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  INVITATION_TOKEN_MAX_AGE,
  invitationTokenCookieName,
  isInvitationFlow,
} from "@/lib/auth/invitation-token-cookie";

const FLOW = "123e4567-e89b-42d3-a456-426614174000";

describe("invitation token flow cookies", () => {
  it("uses a validated UUID flow in a dedicated cookie name", () => {
    expect(isInvitationFlow(FLOW)).toBe(true);
    expect(invitationTokenCookieName(FLOW)).toBe(
      `uribap_invitation_token_${FLOW}`,
    );
  });

  it.each(["", "not-a-uuid", "123e4567-e89b-42d3-a456-42661417400z"])(
    "rejects an invalid flow %j",
    (flow) => {
      expect(isInvitationFlow(flow)).toBe(false);
      expect(() => invitationTokenCookieName(flow)).toThrow();
    },
  );

  it("matches the API's maximum invitation lifetime", () => {
    expect(INVITATION_TOKEN_MAX_AGE).toBe(168 * 3600);
  });
});

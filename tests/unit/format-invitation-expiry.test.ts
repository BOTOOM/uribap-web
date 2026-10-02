import { describe, expect, it } from "vitest";

import { formatInvitationExpiry } from "@/lib/format-invitation-expiry";

describe("formatInvitationExpiry", () => {
  it("formats the initial display in UTC and supports an explicit browser time zone", () => {
    const value = "2027-06-07T00:30:00Z";
    const utc = formatInvitationExpiry(value, "UTC");
    const local = formatInvitationExpiry(value, "America/Los_Angeles");

    expect(utc).not.toBe(local);
    expect(utc).toContain("7");
    expect(local).toContain("6");
  });
});

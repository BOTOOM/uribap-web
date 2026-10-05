import { describe, expect, it } from "vitest";

import { safeReturnTo } from "@/lib/auth/safe-return-to";

describe("safeReturnTo", () => {
  it("preserves an internal path, query, and fragment", () => {
    expect(safeReturnTo("/inventario?tab=lots#current")).toBe("/inventario?tab=lots#current");
  });

  it("preserves a token-free invitation flow query", () => {
    const flow = "123e4567-e89b-42d3-a456-426614174000";
    expect(safeReturnTo(`/invitations/accept?flow=${flow}`)).toBe(
      `/invitations/accept?flow=${flow}`,
    );
  });

  it.each([
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "https://evil.example",
    "/plan\n@evil.example",
    "/plan\u0000",
    "/plan\u0085",
  ])(
    "falls back for unsafe return path %j",
    (value) => {
      expect(safeReturnTo(value)).toBe("/plan");
    },
  );

  it("falls back when the destination is missing", () => {
    expect(safeReturnTo(undefined)).toBe("/plan");
  });
});

import { describe, expect, it } from "vitest";

import {
  decodeTimeZoneCookie,
  isValidTimeZone,
  pickTimeZone,
} from "@/lib/time-zone";

describe("isValidTimeZone", () => {
  it.each(["America/Bogota", "Asia/Tokyo"])("accepts %s", (value) => {
    expect(isValidTimeZone(value)).toBe(true);
  });

  it.each(["", undefined, "Not/A_Timezone", "x".repeat(65)])(
    "rejects %s",
    (value) => {
      expect(isValidTimeZone(value)).toBe(false);
    },
  );
});

describe("pickTimeZone", () => {
  it("returns the first valid candidate", () => {
    expect(pickTimeZone("Asia/Tokyo", "America/Bogota")).toBe("Asia/Tokyo");
  });

  it("skips invalid candidates", () => {
    expect(pickTimeZone("bad", "America/Bogota")).toBe("America/Bogota");
  });

  it("returns null when there is no valid candidate", () => {
    expect(pickTimeZone(undefined, "bad")).toBeNull();
  });
});

describe("decodeTimeZoneCookie", () => {
  it("decodes and validates the cookie value", () => {
    expect(decodeTimeZoneCookie("America%2FBogota")).toBe("America/Bogota");
  });

  it("returns null for malformed or invalid values", () => {
    expect(decodeTimeZoneCookie("%")).toBeNull();
    expect(decodeTimeZoneCookie("Not%2FA_Timezone")).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { todayInTimeZone, toIsoDay } from "@/lib/format";

describe("todayInTimeZone", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the household-local date around the UTC boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T01:30:00Z"));

    expect(todayInTimeZone("America/Bogota")).toBe("2026-09-30");
  });

  it("falls back to the UTC date for an invalid timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T01:30:00Z"));

    expect(todayInTimeZone("Not/A_Timezone")).toBe(toIsoDay(new Date()));
  });
});

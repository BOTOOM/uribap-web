import { afterEach, describe, expect, it, vi } from "vitest";

import { dashboardDateWindow } from "@/lib/dashboard/date-window";
import { todayInTimeZone, toIsoDay } from "@/lib/format";

describe("dashboardDateWindow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the Colombian date after UTC midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T01:00:00Z"));

    const today = todayInTimeZone("America/Bogota");

    expect(today).toBe("2026-10-07");
    expect(dashboardDateWindow(today)).toEqual({
      today: "2026-10-07",
      tomorrow: "2026-10-08",
      weekStart: "2026-10-05",
      weekEnd: "2026-10-11",
    });
  });

  it("uses the UTC date when the time zone is invalid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T01:00:00Z"));

    const today = todayInTimeZone("Not/A_Timezone");

    expect(today).toBe(toIsoDay(new Date()));
    expect(dashboardDateWindow(today).today).toBe("2026-10-08");
  });
});

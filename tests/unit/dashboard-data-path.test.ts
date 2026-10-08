import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  serverApiFetch: vi.fn(),
  serverHouseholdFetch: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/api/server-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(readonly status: number) {
      super();
    }
  },
  serverApiFetch: mocks.serverApiFetch,
  serverHouseholdFetch: mocks.serverHouseholdFetch,
}));

import { loadDashboard } from "@/app/(app)/page";

describe("dashboard data path time-zone resolution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T01:00:00Z"));
    mocks.cookies.mockReset();
    mocks.serverApiFetch.mockReset();
    mocks.serverHouseholdFetch.mockReset();
    mocks.serverHouseholdFetch.mockImplementation((path: string) => {
      if (
        path === "/recipes/published-versions" ||
        path === "/shopping-lists/current" ||
        path === "/preparation-tasks" ||
        path === "/meal-completions" ||
        path.startsWith("/plans/current?") ||
        path.startsWith("/forecast/demand?")
      ) {
        return Promise.resolve({ items: [] });
      }
      throw new Error(`Unexpected household request: ${path}`);
    });
    mocks.serverApiFetch.mockImplementation((path: string) => {
      if (path === "/me") {
        return Promise.resolve({
          memberships: [{ household_id: "household-1", status: "active" }],
        });
      }
      if (path === "/households/household-1") {
        return Promise.resolve({ timezone: "America/Bogota" });
      }
      throw new Error(`Unexpected API request: ${path}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockTimeZoneCookie(value?: string) {
    mocks.cookies.mockResolvedValue({
      get: (name: string) =>
        name === "uribap_tz" && value !== undefined ? { value } : undefined,
    });
  }

  it("uses browser dates for plan and forecast requests without looking up the household zone", async () => {
    mockTimeZoneCookie("Asia%2FTokyo");

    const dashboard = await loadDashboard();

    expect(dashboard).toMatchObject({
      today: "2026-10-08",
      weekStart: "2026-10-05",
      weekEnd: "2026-10-11",
      timeZone: "Asia/Tokyo",
    });
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/plans/current?week_start=2026-10-05",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/forecast/demand?from_date=2026-10-05&to_date=2026-10-11",
    );
    expect(mocks.serverApiFetch).not.toHaveBeenCalledWith("/households/household-1");
  });

  it("uses the active household zone when the browser cookie is absent", async () => {
    mockTimeZoneCookie();

    const dashboard = await loadDashboard();

    expect(dashboard).toMatchObject({
      today: "2026-10-07",
      weekStart: "2026-10-05",
      weekEnd: "2026-10-11",
      timeZone: "America/Bogota",
    });
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/plans/current?week_start=2026-10-05",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/forecast/demand?from_date=2026-10-05&to_date=2026-10-11",
    );
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/households/household-1");
  });

  it("falls back to UTC dates when the household time-zone lookup fails", async () => {
    mockTimeZoneCookie();
    mocks.serverApiFetch.mockImplementation((path: string) => {
      if (path === "/me") {
        return Promise.resolve({
          memberships: [{ household_id: "household-1", status: "active" }],
        });
      }
      if (path === "/households/household-1") {
        return Promise.reject(new Error("Household lookup failed"));
      }
      throw new Error(`Unexpected API request: ${path}`);
    });

    const dashboard = await loadDashboard();

    expect(dashboard).toMatchObject({
      today: "2026-10-08",
      weekStart: "2026-10-05",
      weekEnd: "2026-10-11",
      timeZone: null,
    });
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/plans/current?week_start=2026-10-05",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith(
      "/forecast/demand?from_date=2026-10-05&to_date=2026-10-11",
    );
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/households/household-1");
  });
});

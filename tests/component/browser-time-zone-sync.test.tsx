import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BROWSER_TIME_ZONE_COOKIE } from "@/lib/time-zone";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  router: { refresh: vi.fn() },
  timeZone: "America/Bogota",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

import { BrowserTimeZoneSync } from "@/components/shell/BrowserTimeZoneSync";

describe("BrowserTimeZoneSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.pathname = "/";
    navigation.timeZone = "America/Bogota";
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=; Max-Age=0; Path=/`;
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(
      () => ({ timeZone: navigation.timeZone }) as Intl.ResolvedDateTimeFormatOptions,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, "visibilityState");
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=; Max-Age=0; Path=/`;
  });

  it("resynchronizes on focus and pathname changes only when the zone differs", () => {
    const { rerender } = render(<BrowserTimeZoneSync />);

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=America%2FBogota`);
    expect(navigation.router.refresh).toHaveBeenCalledOnce();

    navigation.timeZone = "Asia/Tokyo";
    window.dispatchEvent(new Event("focus"));

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo`);
    expect(navigation.router.refresh).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event("focus"));
    expect(navigation.router.refresh).toHaveBeenCalledTimes(2);

    navigation.timeZone = "America/New_York";
    navigation.pathname = "/plan";
    rerender(<BrowserTimeZoneSync />);

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=America%2FNew_York`);
    expect(navigation.router.refresh).toHaveBeenCalledTimes(3);
  });

  it("syncs on visibility changes only when the document is visible", () => {
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=America%2FBogota; Path=/`;
    render(<BrowserTimeZoneSync />);

    navigation.timeZone = "Asia/Tokyo";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=America%2FBogota`);
    expect(navigation.router.refresh).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo`);
    expect(navigation.router.refresh).toHaveBeenCalledOnce();
  });
});

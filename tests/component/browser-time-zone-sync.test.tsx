import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BROWSER_TIME_ZONE_COOKIE } from "@/lib/time-zone";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { BrowserTimeZoneSync } from "@/components/shell/BrowserTimeZoneSync";

describe("BrowserTimeZoneSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=; Max-Age=0; Path=/`;
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "Asia/Tokyo",
    } as Intl.ResolvedDateTimeFormatOptions);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=; Max-Age=0; Path=/`;
  });

  it("writes the browser time zone and refreshes when the cookie is absent", () => {
    render(<BrowserTimeZoneSync />);

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo`);
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("replaces a different cookie value and refreshes", () => {
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=America%2FBogota; Path=/`;

    render(<BrowserTimeZoneSync />);

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo`);
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("does nothing when the cookie already matches the browser time zone", () => {
    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo; Path=/`;

    render(<BrowserTimeZoneSync />);

    expect(document.cookie).toContain(`${BROWSER_TIME_ZONE_COOKIE}=Asia%2FTokyo`);
    expect(router.refresh).not.toHaveBeenCalled();
  });
});

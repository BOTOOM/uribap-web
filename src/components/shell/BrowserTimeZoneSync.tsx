"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BROWSER_TIME_ZONE_COOKIE, isValidTimeZone } from "@/lib/time-zone";

export function BrowserTimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!isValidTimeZone(zone)) return;

    const cookieName = `${BROWSER_TIME_ZONE_COOKIE}=`;
    const currentValue = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(cookieName))
      ?.slice(cookieName.length);
    let currentZone: string | null = null;
    if (currentValue !== undefined) {
      try {
        currentZone = decodeURIComponent(currentValue);
      } catch {
        currentZone = null;
      }
    }
    if (currentZone === zone) return;

    document.cookie = `${BROWSER_TIME_ZONE_COOKIE}=${encodeURIComponent(zone)}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    router.refresh();
  }, [router]);

  return null;
}

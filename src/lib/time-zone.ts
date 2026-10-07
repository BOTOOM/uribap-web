export const BROWSER_TIME_ZONE_COOKIE = "uribap_tz";

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function pickTimeZone(
  ...candidates: Array<string | null | undefined>
): string | null {
  return candidates.find(isValidTimeZone) ?? null;
}

export function decodeTimeZoneCookie(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return pickTimeZone(decodeURIComponent(value));
  } catch {
    return null;
  }
}

# Quickstart: Browser-local dashboard date

## Prerequisites

- Install dependencies with the repository package manager.
- Use the existing authenticated API configuration for manual validation.

## Automated validation

```bash
pnpm test -- tests/unit/time-zone.test.ts tests/unit/dashboard-date-window.test.ts tests/unit/format.test.ts tests/component/browser-time-zone-sync.test.tsx
pnpm lint
pnpm typecheck
pnpm build
pnpm test
git diff --check
```

Expected:

- At `2026-10-08T01:00:00Z`, browser zone `Asia/Tokyo` wins over household zone `America/Bogota` and resolves October 8 as today.
- The AppShell date label uses the valid browser zone and retains current formatting when no valid cookie is available.
- Without a valid browser cookie, a valid household zone resolves October 7; without either, the home uses UTC.
- The selected date window has a consistent tomorrow, Monday week start, and Sunday week end.
- The client writes and refreshes only when the browser zone differs from the cookie.
- All checks exit successfully.

## Manual scenario

1. Use a household configured with `America/Bogota` and a browser reporting `Asia/Tokyo`.
2. Clear the `uribap_tz` cookie and open the home.
3. Confirm the initial server render can use the household date, then the client writes the browser zone and refreshes once.
4. Confirm the refreshed home uses the browser's date for "Hoy", "Mañana", the plan week, and forecast range.
5. Confirm the topbar date label uses the browser zone.
6. Reload with the matching cookie and confirm it does not trigger another refresh for time-zone synchronization.

## Fallback scenario

1. Remove or corrupt the browser cookie while leaving a valid household time zone.
2. Load the home and confirm it uses the household date.
3. Make the household read fail or return an invalid time zone while the browser cookie is absent or invalid.
4. Confirm the page remains available and uses the UTC date.

# Convergence: Browser-local dashboard date review follow-up

**Branch**: `devin/1791400891-household-date`
**Base implementation**: `273a6669feef8ed40d13e1cc97a82002455b2540`
**Status**: Review fixes implemented and locally verified.

## Review fixes

- Added `isoDayInTimeZone(instant, timeZone)` and delegated `todayInTimeZone` to the shared
  formatter. The latest-completion relative-day label now converts its instant in the resolved
  dashboard time zone instead of mixing a UTC date with a local `today`.
- Browser time-zone synchronization now runs on pathname changes and on focus/visibility events
  while the document is visible. It still writes the cookie and refreshes only when the detected
  zone differs.
- Added direct `loadDashboard` data-path coverage for the Tokyo cookie, the Bogota household
  fallback, and UTC fallback after household lookup failure, including exact plan and forecast
  request paths.

## Verification

| Gate | Command | Result |
|---|---|---|
| Focused tests | `pnpm exec vitest run --config vitest.config.mts tests/unit/format.test.ts tests/unit/dashboard-date-window.test.ts tests/unit/dashboard-data-path.test.ts tests/component/browser-time-zone-sync.test.tsx` | **PASS** — 4 files, 11 tests. |
| Lint | `pnpm lint` | **PASS**. |
| TypeScript | `pnpm typecheck` | **PASS**. |
| Whitespace | `git diff --check` | **PASS**. |

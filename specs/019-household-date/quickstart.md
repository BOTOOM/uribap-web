# Quickstart: Household-local dashboard date

## Prerequisites

- Install dependencies with the repository package manager.
- Use the existing authenticated API configuration for manual validation.

## Automated validation

```bash
pnpm test -- tests/unit/dashboard-date-window.test.ts tests/unit/format.test.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Expected:

- `America/Bogota` resolves to October 7 at an instant when UTC is already October 8.
- The resulting date window is October 7 for today, October 8 for tomorrow, October 5 for Monday, and October 11 for Sunday.
- All checks exit successfully.

## Manual scenario

1. Use a household configured with `America/Bogota`.
2. At a time between 7:00 p.m. and 11:59 p.m. Colombia time, open the home.
3. Confirm the meals for the Colombian calendar date remain under "Hoy".
4. Confirm the next calendar day's meals appear under "Mañana".
5. Confirm the current week's plan and forecast match the week containing Colombia's date.

## Fallback scenario

1. Simulate a failed household read or invalid time-zone value.
2. Load the home.
3. Confirm the page remains available and uses the UTC date, matching the previous behavior.

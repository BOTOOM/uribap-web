# UI Contract: Dashboard date window

## Inputs

- Authenticated account response containing memberships.
- Active household response containing an IANA time zone.
- Current instant.

## Output behavior

- The "Hoy" section contains entries whose planned date equals the household-local `today`.
- The "Mañana" section contains entries whose planned date equals `today + 1 day`.
- The current plan query uses the Monday containing household-local `today`.
- The demand forecast spans that Monday through Sunday.

## Failure behavior

- Account failure retains the existing full-page account error.
- No active membership, household lookup failure, or invalid time zone uses the UTC calendar date.
- Failures in plans, recipes, forecast, shopping, tasks, or completions remain isolated as before.

## Non-goals

- No API schema change.
- No household time-zone editing.
- No visual redesign.
- No browser-local time-zone override.

# UI Contract: Dashboard date window

## Inputs

- Request cookie `uribap_tz` containing an encoded IANA time-zone identifier, if present.
- Authenticated account response containing memberships.
- Active household response containing an IANA time zone when the browser cookie is absent or invalid.
- Current instant.

## Output behavior

- A valid browser cookie is the primary time-zone authority. A valid value is non-empty, at most 64 characters after decoding, and accepted by `Intl.DateTimeFormat`.
- The "Hoy" section contains entries whose planned date equals `today` in the selected time zone.
- The "Mañana" section contains entries whose planned date equals `today + 1 day`.
- The current plan query uses the Monday containing selected-zone `today`.
- The demand forecast spans that Monday through Sunday.
- The AppShell date label uses the valid browser cookie time zone and retains its existing default formatting when the cookie is absent or invalid.
- A valid browser cookie skips the household lookup used only for time-zone selection.
- On first visit without a valid cookie, the server uses the household time zone when available. The client writes the browser zone and refreshes only if it differs from the cookie.

## Failure behavior

- Account failure retains the existing full-page account error.
- An absent, malformed, or invalid browser cookie falls back to the active household time zone.
- No active membership, household lookup failure, or invalid household time zone uses the UTC calendar date.
- Failures in plans, recipes, forecast, shopping, tasks, or completions remain isolated as before.

## Non-goals

- No API schema change.
- No household time-zone editing.
- No visual redesign.
- No change to the shared `dashboardDateWindow` helper.

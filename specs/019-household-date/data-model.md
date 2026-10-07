# Data Model: Browser-local dashboard date

No server-side persistence changes are required. The browser time zone is carried in a cookie.

## Browser time zone

- Cookie name: `uribap_tz`.
- Value: URL-encoded IANA time-zone identifier reported by `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Cookie attributes: `Path=/`, one-year `Max-Age`, `SameSite=Lax`, and `Secure` on HTTPS; it is not `HttpOnly` because the browser writes it.
- Validation: decoded value must be non-empty, no longer than 64 characters, and accepted by `Intl.DateTimeFormat`.

## Active household membership

- `household_id`: Identifies the fallback household.
- `status`: Only an active membership is eligible when no valid browser time zone exists.

## Household time zone fallback

- `timezone`: Existing IANA time-zone identifier used when the browser cookie is absent or invalid, for example `America/Bogota`.

## Dashboard date window

- `today`: ISO calendar date in browser time zone, otherwise household time zone, otherwise UTC.
- `tomorrow`: `today` plus one calendar day.
- `weekStart`: Monday containing `today`.
- `weekEnd`: Sunday containing `today`.

## Validation rules

- A valid browser cookie is selected without fetching household time-zone metadata.
- An absent or invalid browser cookie triggers household time-zone fallback.
- A missing active membership, failed household lookup, or invalid household time zone triggers UTC fallback.
- A first visit without a valid cookie initially renders with the household fallback, then the client writes the browser time zone and refreshes if the cookie differs.
- Calendar arithmetic operates on date-only UTC representations after the local date is resolved, avoiding host-local offsets.

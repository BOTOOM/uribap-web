# Data Model: Household-local dashboard date

No persistence changes are required.

## Active household membership

- `household_id`: Identifies the household whose calendar applies.
- `status`: Only an active membership is eligible.

## Household calendar

- `timezone`: Existing IANA time-zone identifier, for example `America/Bogota`.

## Dashboard date window

- `today`: Household-local ISO calendar date.
- `tomorrow`: `today` plus one calendar day.
- `weekStart`: Monday containing `today`.
- `weekEnd`: Sunday containing `today`.

## Validation rules

- A missing active membership triggers UTC fallback.
- A failed household lookup triggers UTC fallback.
- An invalid time zone triggers UTC fallback.
- Calendar arithmetic operates on date-only UTC representations after the local date is resolved, avoiding host-local offsets.

# Research: Browser-local dashboard date

## Decision 1: Prefer the browser time zone carried in a request cookie

**Decision**: Use the validated `uribap_tz` cookie first. If it is absent or invalid, use the active household's stored IANA time zone; if neither is valid, use UTC.

**Rationale**: Household members may be in different locations, so the person viewing the home expects dates in their browser's local time zone. A cookie lets Server Components read that zone. A valid cookie avoids an otherwise unnecessary household lookup.

**Alternatives considered**:

- Household time zone as primary: rejected because the user can be in a different location from the household.
- Server/Vercel time zone: rejected because production servers commonly run in UTC.
- Fixed `America/Bogota`: rejected because users may be elsewhere.

## Decision 2: Calculate a complete date window from one local date

**Decision**: Produce `today`, `tomorrow`, `weekStart`, and `weekEnd` from the same selected-zone ISO date.

**Rationale**: This prevents labels and API query windows from disagreeing at midnight boundaries.

**Alternatives considered**:

- Fix only meal filtering: rejected because the plan and forecast query could still request the wrong week.
- Calculate each value independently from the current instant: rejected because a boundary crossed between calls could produce inconsistent values.

## Decision 3: Synchronize the browser zone on the client

**Decision**: A small client leaf reads the browser's resolved IANA zone, validates it, and writes the `uribap_tz` cookie if it differs. It calls `router.refresh()` only after a write.

**Rationale**: Server Components cannot discover the browser's time zone directly. On first visit the server uses the household fallback; the client then provides the browser value for the refreshed server render. On later visits, a valid cookie is available immediately.

**Alternatives considered**:

- Server-set cookie: unavailable during Server Component rendering.
- Refresh on every render: rejected because the cookie only needs to be updated when the browser zone changes.

## Decision 4: Preserve UTC as the final fallback

**Decision**: If neither the browser cookie nor household lookup provides a valid time zone, retain the UTC-derived date.

**Rationale**: The home isolates data-source failures and should remain available. UTC preserves current behavior when no local authority is available.

**Alternatives considered**:

- Fail the entire home: rejected because time-zone metadata is not required to render available sections.
- Guess a fixed zone: rejected because both users and households may be elsewhere.

## Decision 5: Test pure boundaries and client synchronization

**Decision**: Keep `dashboardDateWindow` unchanged; test browser-over-household zone choice, validation, cookie synchronization, and the existing UTC boundary.

**Rationale**: Pure tests cover deterministic date selection, while a focused component test verifies cookie write and refresh behavior without mocking the full route and authentication stack.

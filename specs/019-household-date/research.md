# Research: Household-local dashboard date

## Decision 1: Reuse the household's persisted IANA time zone

**Decision**: Resolve the active membership from `/me`, read that household, and use its `timezone` value.

**Rationale**: The weekly plan already follows this path, so the home should follow the same product rule rather than introduce a browser-specific or deployment-specific time zone.

**Alternatives considered**:

- Browser time zone: rejected because the household may be managed while traveling and the configured household calendar is authoritative.
- Fixed `America/Bogota`: rejected because the product supports household-specific time zones.
- Server/Vercel time zone: rejected because production servers commonly run in UTC.

## Decision 2: Calculate a complete date window from one local date

**Decision**: Produce `today`, `tomorrow`, `weekStart`, and `weekEnd` from the same household-local ISO date.

**Rationale**: This prevents labels and API query windows from disagreeing at midnight boundaries.

**Alternatives considered**:

- Fix only meal filtering: rejected because the plan and forecast query could still request the wrong week.
- Calculate each value independently from the current instant: rejected because a boundary crossed between calls could produce inconsistent values.

## Decision 3: Preserve UTC as the fallback

**Decision**: If membership, household, or time-zone resolution fails, retain the current UTC-derived date.

**Rationale**: The home isolates data-source failures and should remain available. UTC exactly preserves current behavior.

**Alternatives considered**:

- Fail the entire home: rejected because time-zone metadata is not required to render all available sections.
- Guess Colombia: rejected because households may use other time zones.

## Decision 4: Test pure boundary behavior

**Decision**: Extract a pure date-window function that accepts an ISO date and test it alongside the existing time-zone helper.

**Rationale**: The defect is a deterministic calendar-boundary issue. Pure tests are faster and less brittle than mocking the full Next.js route and authentication stack.

**Alternatives considered**:

- Browser E2E only: rejected because server clocks and household data make the boundary harder to control.
- Inline route logic with no regression test: rejected because the bug can recur unnoticed.

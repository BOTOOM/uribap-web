# Feature Specification: Household-local dashboard date

**Feature Branch**: `devin/1791400891-household-date`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "The home uses UTC around 8 p.m. in Colombia and advances to another day. Calculate today and tomorrow using the household time zone."

## User Scenarios & Testing

### User Story 1 - See the correct local day on the home (Priority: P1)

As a household member, I see meals under "Hoy" and "Mañana" according to the household's configured local date, even when the UTC date has already advanced.

**Why this priority**: Showing meals under the wrong day makes the operational home misleading and can cause a meal to be skipped or recorded against the wrong date.

**Independent Test**: Set the current instant after midnight UTC but before midnight in Colombia, load a household configured for `America/Bogota`, and verify the home still treats the Colombian calendar date as today.

**Acceptance Scenarios**:

1. **Given** the instant is 01:00 UTC on October 8 and the household time zone is `America/Bogota`, **When** the member opens the home, **Then** October 7 entries appear under "Hoy" and October 8 entries under "Mañana".
2. **Given** the household time zone has a different local date than the server, **When** the home requests the current weekly plan and forecast, **Then** it requests the week containing the household-local date.
3. **Given** the household time zone matches the server's current calendar date, **When** the member opens the home, **Then** the existing day grouping remains unchanged.

---

### User Story 2 - Keep the home usable if time-zone data fails (Priority: P2)

As a household member, I can still load the home if the household record or its time zone cannot be read.

**Why this priority**: A metadata failure should not make the entire operational home unavailable.

**Independent Test**: Make the household lookup fail and verify the home falls back to the server's UTC calendar date while preserving its existing error isolation for other sections.

**Acceptance Scenarios**:

1. **Given** the active membership exists but the household lookup fails, **When** the home loads, **Then** it uses the UTC date as a fallback and continues loading available sections.
2. **Given** the household has an invalid time-zone value, **When** the home loads, **Then** it uses the UTC date as a fallback rather than throwing.

### Edge Cases

- The UTC date changes while the household-local date is still the previous day.
- The household is ahead of UTC and its local date is already the following day.
- There is no active household membership.
- The household lookup returns an invalid IANA time zone.
- The household-local date falls on Sunday and the weekly query must still start on the preceding Monday.

## Requirements

### Functional Requirements

- **FR-001**: The home MUST derive its current calendar date from the active household's configured time zone.
- **FR-002**: The home MUST derive "Mañana" by adding one calendar day to the household-local current date.
- **FR-003**: The home MUST derive the current week and forecast range from the household-local current date.
- **FR-004**: The home MUST fetch the active household time zone using the authenticated member's active household membership.
- **FR-005**: The home MUST fall back to the UTC calendar date if no active membership exists, the household cannot be loaded, or the time zone is invalid.
- **FR-006**: The home MUST preserve independent loading and error handling for plans, recipes, forecasts, shopping, preparation, and completions.
- **FR-007**: Automated coverage MUST exercise the date boundary where UTC is on the next day while Colombia is still on the previous day.

### Key Entities

- **Active household membership**: Associates the signed-in member with the household whose calendar rules apply.
- **Household time zone**: IANA time-zone identifier used to determine the household's current calendar date.
- **Dashboard date window**: The household-local today, tomorrow, current Monday, and current Sunday used by home queries and labels.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At every instant in a 24-hour day, home entries labeled "Hoy" match the active household's calendar date.
- **SC-002**: At the Colombia/UTC boundary, October 7 meals remain under "Hoy" until midnight in `America/Bogota`.
- **SC-003**: The home continues rendering when household time-zone retrieval fails.
- **SC-004**: Existing home data sections keep their previous success and failure behavior.

## Assumptions

- Each household already stores a valid IANA time zone and exposes it through the existing household read operation.
- The active membership returned by the existing account operation determines which household time zone applies.
- UTC is the safe fallback because it matches the current behavior.
- This change is limited to the home; the weekly plan already uses the household time zone.

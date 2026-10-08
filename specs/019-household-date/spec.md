# Feature Specification: Browser-local dashboard date

**Feature Branch**: `devin/1791400891-household-date`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Use the user's browser time zone for the home's date because household members may be in different locations."

## User Scenarios & Testing

### User Story 1 - See the correct local day on the home (Priority: P1)

As a household member, I see meals under "Hoy" and "Mañana" according to my browser's local date, even when the household's configured time zone or the server has a different date.

**Why this priority**: Showing meals under the wrong day makes the operational home misleading and can cause a meal to be skipped or recorded against the wrong date.

**Independent Test**: Set the current instant to `2026-10-08T01:00:00Z`, use a browser in `Asia/Tokyo` and a household configured for `America/Bogota`, and verify the home treats October 8 as today.

**Acceptance Scenarios**:

1. **Given** the instant is 01:00 UTC on October 8, the browser time zone is `Asia/Tokyo`, and the household time zone is `America/Bogota`, **When** the member opens the home, **Then** October 8 entries appear under "Hoy" and October 9 entries under "Mañana".
2. **Given** a valid browser time-zone cookie, **When** the home resolves its date, **Then** it uses that zone and does not fetch the household record solely to resolve the time zone.
3. **Given** the browser cookie is absent on the first visit, **When** the home is server-rendered, **Then** it temporarily uses the household time zone; after the client writes the browser zone and refreshes once, it uses the browser-local date.
4. **Given** the browser time zone differs from the household time zone, **When** the home requests the current weekly plan and forecast, **Then** it requests the week containing the browser-local date.
5. **Given** a valid browser time-zone cookie, **When** the AppShell renders its date label, **Then** it formats the label in that browser time zone.

---

### User Story 2 - Keep the home usable if time-zone data fails (Priority: P2)

As a household member, I can still load the home if the browser cookie or household time-zone metadata is missing, invalid, or unavailable.

**Why this priority**: A metadata failure should not make the entire operational home unavailable.

**Independent Test**: Test missing and malformed browser cookies, household lookup failure, and invalid household time zones; verify the ordered fallback and existing error isolation.

**Acceptance Scenarios**:

1. **Given** the browser cookie is absent or invalid and the active household has a valid time zone, **When** the home loads, **Then** it uses the household-local date.
2. **Given** there is no active membership or the household lookup fails or returns an invalid time zone, **When** the browser cookie is also invalid or absent, **Then** the home uses UTC and continues loading available sections.
3. **Given** the browser cookie contains malformed encoding, **When** the home loads, **Then** it ignores the cookie and follows the remaining fallback order without throwing.

### Edge Cases

- The browser date differs from both UTC and the household-local date.
- A valid browser cookie is stale after a user changes location; the client replaces it and refreshes.
- The UTC date changes while the selected local date is still the previous day.
- The browser is ahead of UTC and its local date is already the following day.
- There is no active household membership.
- The household lookup returns an invalid IANA time zone.
- The browser-local date falls on Sunday and the weekly query must still start on the preceding Monday.
- The cookie value is malformed or decodes to an invalid or overlong time-zone identifier.

## Requirements

### Functional Requirements

- **FR-001**: The home MUST use the valid browser time zone from the `uribap_tz` cookie as its primary calendar authority.
- **FR-002**: The home MUST derive "Mañana" by adding one calendar day to the selected local date.
- **FR-003**: The home MUST derive the current plan week and forecast range from that same selected local date.
- **FR-004**: If the browser cookie is absent or invalid, the home MUST use the authenticated member's active household time zone when available; it MUST skip the household lookup when the browser cookie is valid.
- **FR-005**: The home MUST fall back to the UTC calendar date if neither the browser cookie nor the active household provides a valid time zone.
- **FR-006**: On a first visit without a valid browser cookie, the server MUST render using the household time zone when available; the client MUST write the browser time zone and refresh only when the cookie differs.
- **FR-007**: The home MUST preserve independent loading and error handling for plans, recipes, forecasts, shopping, preparation, and completions.
- **FR-008**: Automated coverage MUST exercise browser-zone precedence over a different household zone at a date boundary.
- **FR-009**: The AppShell date label MUST use a valid browser time zone and preserve its current formatting behavior when no valid browser cookie is available.

### Key Entities

- **Browser time zone**: The valid IANA time-zone identifier reported by the user's browser and carried to Server Components in the `uribap_tz` cookie.
- **Active household membership**: Provides the household time zone only when no valid browser zone is available.
- **Household time zone**: Existing IANA time-zone identifier used as the first fallback.
- **Dashboard date window**: Today, tomorrow, current Monday, and current Sunday derived from the selected browser, household, or UTC date.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Whenever the browser cookie contains a valid zone, home entries labeled "Hoy" match the browser's calendar date.
- **SC-002**: At `2026-10-08T01:00:00Z`, an `Asia/Tokyo` browser yields October 8 as today even when the household uses `America/Bogota`.
- **SC-003**: On first visit without a valid cookie, the household fallback renders and the client refreshes after setting the browser zone.
- **SC-004**: The home continues rendering with household-local or UTC fallback when browser or household time-zone metadata is unavailable.
- **SC-005**: Existing home data sections keep their previous success and failure behavior.
- **SC-006**: The AppShell date label uses the valid browser time zone and retains its current server-default behavior when the cookie is absent or invalid.

## Assumptions

- The browser reports an IANA time zone through `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- The browser time zone is stored in a non-HttpOnly `uribap_tz` cookie so Server Components can read it.
- The active membership and existing household read operation provide the first fallback time zone.
- UTC is the safe fallback because it matches the current behavior.
- This change affects the home date window and AppShell date label; it does not change the plan page's separate date behavior.

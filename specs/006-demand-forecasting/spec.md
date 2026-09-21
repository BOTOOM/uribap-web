# Feature Specification: Demand Forecast Web Experience

**Feature Branch**: `006-demand-forecasting`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: A household member opens the forecast view and sees projected ingredient demand for the plan week — required, optional, on-hand, and shortfall per ingredient+unit. Independent test: render the page with a seeded projection and assert the table columns and line rows.
- **US2 (P1)**: The member moves between weeks (previous/next) and the projection reloads for that window. Independent test: week navigation changes the `from_date`/`to_date` sent to the BFF.
- **US3 (P1)**: Lines with a shortfall are visually highlighted; fully covered lines read as covered. Independent test: component test asserts the shortfall affordance on a deficient line.
- **US4 (P2)**: When no approved plan feeds the window, the page shows an explicit empty state rather than a blank table. Independent test: render with zero considered plans and assert the empty copy.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the pinned contract for the forecast response.
- **FR-002**: Web MUST NOT compute scaling, aggregation, availability, or shortfall in React; the API response is authoritative and rendered verbatim.
- **FR-003**: The view MUST be a read-only projection — no mutation controls, no writes through BFF.
- **FR-004**: The page MUST expose loading, empty (no demand), error, and forbidden states.
- **FR-005**: Week navigation MUST keep `from_date`/`to_date` aligned to a Monday–Sunday window matching the plan cadence.
- **FR-006**: The table MUST state that demand comes from approved plans only, and show `required_amount`, `optional_amount`, `on_hand_amount`, and `shortfall_amount` per line.
- **FR-007**: Interactive controls MUST meet keyboard, accessibility, responsive (375/768/1024/1440), and reduced-motion gates.

## Acceptance

- A member sees the current week's projected demand or an explicit empty state.
- Shortfall lines are distinguishable without color alone (text/badge carries the meaning).
- Different units of one ingredient render as separate lines, exactly as returned.
- No provider or API token is exposed to the browser; the route handler only forwards `from_date`/`to_date` and auth.

## Edge cases

- Week without approved plans → empty state explaining demand comes from approved plans.
- API 403 (not a member) → forbidden state.
- Very long ingredient names or large amounts → no horizontal overflow; amounts keep fixed decimal formatting.
- API error or unreachable → error state with retry.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; navigation reachable by keyboard.
- Contract snapshot version matches API revision `demand-forecasting-*`.

## Out of scope

Shopping list generation, purchases, preparation tasks, meal completion, unit conversion, email delivery, notifications, and deployment.

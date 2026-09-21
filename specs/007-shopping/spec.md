# Feature Specification: Shopping Web Experience

**Feature Branch**: `007-shopping`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: A household member opens the shopping view and sees the current open list with pending, purchased, and skipped items for the projection window. Independent test: render with a seeded list and assert grouped statuses.
- **US2 (P1)**: With no live list, the member generates one from a chosen week window through an explicit action. Independent test: the empty state offers the generate action and posts `from_date`/`to_date`.
- **US3 (P1)**: The member records a purchase for a pending item (quantity, location, optional expiration) and sees the item flip to purchased; skip and restore work symmetrically. Independent test: component tests exercise the purchase form and skip/restore calls.
- **US4 (P1)**: The member completes a list with no pending items, reopens it, or archives it. Independent test: the action bar renders legal transitions per state and forwards `expected_version`.
- **US5 (P2)**: A stale `expected_version` produces a conflict state with a reload path. Independent test: a 409 response renders the conflict affordance.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the pinned contract.
- **FR-002**: Mutations MUST send `expected_version` from server-loaded data and forward `Idempotency-Key` through the BFF boundary.
- **FR-003**: Web MUST NOT compute demand, shortfall, or inventory effects in React; the API responses are authoritative.
- **FR-004**: The page MUST expose loading, empty (no list), error, forbidden, conflict, and per-status item states.
- **FR-005**: The view MUST state that purchases create real inventory (a lot plus a `purchase` movement) — unlike planning, this flow does mutate stock.
- **FR-006**: Interactive controls MUST meet keyboard, accessibility, responsive (375/768/1024/1440), and reduced-motion gates.

## Acceptance

- A member sees the current list or an explicit generate-list empty state with a week picker.
- Item actions appear only for legal transitions of that item's status and the list's `open` state.
- A 409 conflict response surfaces a reload affordance rather than retrying silently.
- No provider or API token is exposed to the browser.

## Edge cases

- Window with zero shortfall → generated list renders an "all covered" state, not an error.
- List completed or archived between load and mutation → 409 conflict path.
- Purchase quantity in a different unit than the item → API 422 surfaced as form error.
- Duplicate generation for the same window → API 409 surfaced.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; all mutations reachable by keyboard.
- Contract snapshot version matches API revision `shopping-*`.

## Out of scope

Preparation, meal completion, consumption posting, unit conversion, email delivery, notifications, and deployment.

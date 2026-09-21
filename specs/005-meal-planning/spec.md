# Feature Specification: Meal Planning Web Experience

**Feature Branch**: `005-meal-planning`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: Browse the current week's plan grouped by day and meal type with state (`draft`, `proposed`, `approved`, `archived`) and version visible. Independent test: render the page with a seeded plan and assert day grouping plus state/version badges.
- **US2 (P1)**: Add, edit, and remove planned meals while the plan is `draft`, choosing from published recipe versions returned by `GET /api/v1/recipes/published-versions` (added by API 005; the 003 contract only exposed `latest_version` numbers, not version UUIDs). Independent test: component tests exercise the picker and entry actions.
- **US3 (P1)**: Propose, approve, reopen, or archive the plan through explicit actions; self-approval is rejected when another member exists. Independent test: transition bar renders the legal actions for each state and forwards `expected_version`.
- **US4 (P2)**: A stale `expected_version` produces a conflict state with a reload path, never a silent overwrite. Independent test: a 409 Problem Details response renders the conflict state.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the pinned contract.
- **FR-002**: Mutations MUST send `expected_version` from server-loaded data and forward `Idempotency-Key` through the BFF boundary.
- **FR-003**: Web MUST NOT derive plan state, demand, or inventory effects in React; FastAPI responses are authoritative.
- **FR-004**: The page MUST expose loading, empty (no plan), error, forbidden, and conflict states.
- **FR-005**: The plan view MUST state that planned meals are projected demand, not inventory deductions.
- **FR-006**: Interactive controls MUST meet keyboard, accessibility, responsive (375/768/1024/1440), and reduced-motion gates.

## Acceptance

- A member sees the current week plan or an explicit create-plan empty state.
- Entries can only change while the API reports `draft`; other states render read-only.
- A 409 conflict response surfaces a reload affordance rather than retrying silently.
- No provider or API token is exposed to the browser.

## Edge cases

- Week with no plan → create-plan empty state instead of an error.
- Plan transitioned by another member between load and mutation → conflict path via `expected_version`.
- Entry referencing a version unpublished after planning → API 422 surfaced as form error.
- Archived plan id → readable history without edit controls.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; all mutations reachable by keyboard.
- Contract snapshot version `v5` matches API revision `meal-planning-*`.

## Out of scope

Email delivery, notifications, deployment, forecasting math, shopping, preparation, and meal completion.

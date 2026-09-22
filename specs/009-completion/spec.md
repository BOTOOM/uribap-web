# Feature Specification: Meal Completion Web Experience

**Feature Branch**: `009-completion`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: On an `approved` plan, a member marks a plan entry as cooked from `/plan`; the page shows the new completion with planned vs actual amounts. Independent test: complete action posts through the BFF and refreshes.
- **US2 (P1)**: The member edits a line's actual amount before submitting, or corrects it afterwards via an inline form. Independent test: component tests post `correct` with `expected_version`.
- **US3 (P1)**: The member reopens a completion recorded by mistake; the entry returns to a completable state. Independent test: reopen posts `expected_version` and renders the reopened state.
- **US4 (P1)**: A stale `expected_version` or insufficient stock produces a conflict state with a reload path. Independent test: 409 renders the conflict affordance.
- **US5 (P2)**: The member sees each completed meal's origin (recipe, meal type, planned date) and its line-level planned/actual differences. Independent test: completed rows render names and diff highlights.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the pinned contract v9.
- **FR-002**: Mutations MUST send `expected_version` from server-loaded data and forward `Idempotency-Key` through the BFF boundary.
- **FR-003**: Web MUST NOT compute consumption, FEFO order, or reconciliation math in React; API responses are authoritative. Planned-vs-actual difference is a display comparison only.
- **FR-004**: The completion UI MUST expose loading, empty (no completions), error, forbidden, conflict, insufficient-stock, per-state (`recorded`/`reopened`), and success states.
- **FR-005**: Entries on non-approved plans MUST NOT render a complete action.
- **FR-006**: Interactive controls MUST meet keyboard, accessibility, responsive (375/768/1024/1440), and reduced-motion gates.

## Acceptance

- Approved-plan entries show a complete affordance; completing shows lines with planned vs actual and updates inventory views on next load.
- Correcting a line updates the displayed actual; reopening marks the completion `reopened` and the entry becomes completable again.
- 409 (stale version or insufficient stock) surfaces a reload affordance without losing context.
- No provider or API token is exposed to the browser.

## Edge cases

- No completions yet → the section collapses to its empty hint.
- Entry completed between load and click → 409 path.
- Insufficient stock → explicit conflict message naming the failure, not a generic error.
- `reopened` completions render read-only with their reversal outcome.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; all mutations reachable by keyboard.
- Contract snapshot version matches API revision `completion-*`.

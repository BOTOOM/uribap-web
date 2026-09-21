# Feature Specification: Preparation Web Experience

**Feature Branch**: `008-preparation`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: A household member opens `/preparacion` and sees preparation tasks ordered by due time, with overdue tasks visually distinct from upcoming ones. Independent test: render with seeded tasks and assert ordering/labels.
- **US2 (P1)**: The member completes or cancels a pending task with an explicit action; completed/cancelled tasks show their outcome without actions. Independent test: component tests call the BFF with `expected_version`.
- **US3 (P1)**: The member creates a manual task (title, due date/time, optional ingredient and amount). Independent test: the manual form posts the payload and refreshes.
- **US4 (P1)**: A stale `expected_version` produces a conflict state with a reload path. Independent test: a 409 response renders the conflict affordance.
- **US5 (P2)**: The member sees where each derived task comes from (recipe, meal type, planned date). Independent test: derived rows render origin labels, not raw ids.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the pinned contract.
- **FR-002**: Mutations MUST send `expected_version` from server-loaded data and forward `Idempotency-Key` through the BFF boundary.
- **FR-003**: Web MUST NOT compute due times, task ordering beyond API order, or any domain rule in React; the API responses are authoritative. Overdue is a display comparison against the API-provided `due_at`, not a domain mutation.
- **FR-004**: The page MUST expose loading, empty (no tasks), error, forbidden, conflict, per-status, and overdue states.
- **FR-005**: Derived tasks MUST display origin context (recipe name, meal type, planned date); manual tasks display their title and optional ingredient/amount.
- **FR-006**: Interactive controls MUST meet keyboard, accessibility, responsive (375/768/1024/1440), and reduced-motion gates.
- **FR-007**: Recipe preparation rules are API-managed in phase 008 API; Web MAY defer a rule-editing surface — recipe authoring UI evolves separately and is out of scope here.

## Acceptance

- A member sees pending tasks first by due time, then resolved tasks; overdue pending tasks are marked.
- Complete/cancel appear only on pending tasks; a 409 surfaces a reload affordance.
- The manual form validates required fields client-side only for UX and relies on API errors as authoritative.
- No provider or API token is exposed to the browser.

## Edge cases

- No tasks → explicit empty state explaining tasks derive from approved plans.
- Task completed/cancelled between load and click → 409 conflict path.
- `due_at` in the past → overdue badge, not an error.
- Recipe/ingredient deleted later → API-resolved names may be empty; row still renders.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; all mutations reachable by keyboard.
- Contract snapshot version matches API revision `preparation-*`.

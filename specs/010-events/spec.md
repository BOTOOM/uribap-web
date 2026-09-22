# Feature Specification: Household Activity Web Experience

**Feature Branch**: `010-events`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: A member opens `/settings/household` and sees an `Actividad`
  section listing recent household events — invitations, plan approvals,
  purchases, preparation outcomes, meal completions — newest first.
  Independent test: the page renders entries from the BFF with localized labels.
- **US2 (P1)**: The member sees the email intent status of household
  notifications (`pendiente`, `enviado`, `fallido`, `suprimido`) as a small
  summary, making it obvious no email was actually sent.
  Independent test: suppressed counts render with their explanatory hint.
- **US3 (P1)**: The feed paginates (`Cargar más`) without leaving the page.
  Independent test: a second page appends entries and hides the control at the
  end.
- **US4 (P2)**: Loading, empty, error, and forbidden states render through the
  shared state components. Independent test: mocked API states map to the right
  state components.

## Requirements

- **FR-001**: Web MUST use generated API types (`components["schemas"]`) from the
  pinned contract v10 (`ActivityFeedResponse`, `ActivityEntry`,
  `OutboxSummary`).
- **FR-002**: The feed MUST be read-only — no mutations, no domain logic in
  React; event payloads render as display labels with a kind→label map.
- **FR-003**: The activity section MUST live inside `/settings/household` — no
  new top-level navigation surface.
- **FR-004**: UI MUST expose loading, empty, error, forbidden, and success
  states, plus a `suppressed` email hint explaining delivery is disabled.
- **FR-005**: Keyboard, accessibility, responsive (375/768/1024/1440), and
  reduced-motion gates apply.

## Acceptance

- `/settings/household` shows the newest household events with timestamps and a
  kind label; payloads render stable references only.
- The outbox summary shows per-status counts; `suppressed` renders its
  "envío de email deshabilitado" hint.
- `Cargar más` appends the next page until `has_more` is false.
- No provider or API token is exposed to the browser.

## Edge cases

- No events yet → empty-state hint inside the section.
- Unknown event kind → renders the raw kind as a muted label (forward-compat).
- API error → shared error state with a reload affordance.

## Measurable outcomes

- Zero horizontal overflow at 375–1440px; no serious axe violations; pagination
  reachable by keyboard.
- Contract snapshot version matches the merged API 010 revision.

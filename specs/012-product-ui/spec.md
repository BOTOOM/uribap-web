# Feature Specification: Product UI Redesign (Mesa)

**Feature Branch**: `012-product-ui`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: A household member opens Uribap and sees an operational
  dashboard — today's meals, tomorrow, inventory forecast, shopping summary,
  recent completions, preparation reminders — built from real API data, not a
  presentation page.
- **US2 (P1)**: Every app surface (plan, forecast, recipes, inventory,
  shopping, preparation, household settings, login, onboarding) shares the
  editorial "mesa" visual language: warm off-white canvas, serif display
  type, mono metadata, green accent, calm dense cards.
- **US3 (P1)**: The weekly planner is navigable (previous/next/this week),
  shows a 7-day meal grid on desktop and a day picker on mobile, and reflects
  plan state (draft/proposed/approved) and completion actions from the API.
- **US4 (P1)**: The app is fully responsive at 375/768/1024/1440 px with no
  horizontal overflow, ≥44px touch targets, visible focus, and a bottom
  navigation bar with a "more" sheet on mobile.
- **US5 (P2)**: Icons and microinteractions (nav, checks, toasts, status
  changes, assistant) are animated but respect `prefers-reduced-motion`.
- **US6 (P2)**: Loading, empty, error, permission, stale/conflict, and
  API-unavailable states exist on every data surface.
- **US7 (P2)**: Verified user journeys are documented as Gherkin scenarios
  after being exercised in a real browser.

## Requirements

- **FR-001**: Replace the `foundation-*` presentation layer with the mesa
  design system: tokens (`--bg`, `--surface`, `--fg`, `--muted`, `--border`,
  `--accent`, semantic state colors), radii (10/14/20 px), soft shadows,
  `cubic-bezier(.2,0,0,1)` easing.
- **FR-002**: Load Newsreader (display), Manrope (body), IBM Plex Mono
  (metadata) via `next/font/google`; no external font requests at runtime.
- **FR-003**: App shell = sticky left sidebar (brand, icon nav, household
  footer) + topbar (date breadcrumb, member avatar) on desktop; bottom nav +
  "Más" sheet on mobile; skip link and `aria-current` preserved.
- **FR-004**: `/` becomes the authenticated dashboard inside the `(app)`
  guard: today's meals, tomorrow's meals, inventory forecast highlights,
  shopping summary, latest completion, next preparation reminder — all
  fetched server-side from existing endpoints; the API remains authoritative.
- **FR-005**: `/plan` renders a week toolbar (prev/next/today), a 7-column
  `week-grid` of meal cards (empty slots included), plan state chip,
  transition bar, entry add/edit/remove actions, completion actions, and an
  impact panel area; on ≤820px a day picker selects one day column.
- **FR-006**: Recipes, inventory, shopping, preparation, forecast and
  settings pages adopt the reference row/card patterns (`recipe-card`,
  `inventory-row`, `shopping-item`+`check`, `timeline-group`, `settings-row`,
  `partner-card`) while keeping every existing mutation and contract.
- **FR-007**: Icon set from `@phosphor-icons/react`; microinteractions via
  CSS keyframes + `motion` where useful; all animation gated by
  `prefers-reduced-motion`.
- **FR-008**: Week navigation uses a proven date library (`date-fns`) for
  Monday-anchored week math; React never reimplements domain calculations.
- **FR-009**: Login, onboarding, invitation-accept, auth-error, not-found and
  error pages adopt the auth/onboarding card patterns of the reference.
- **FR-010**: Document exercised flows in `docs/journeys/*.feature`
  (Gherkin), each marked verified only after a real browser pass.

## Acceptance

- Visual language matches the reference: tokens, typography, card density,
  sidebar + mobile nav shell, planner grid, impact panel.
- Every existing mutation (plan transitions, entries, completions,
  purchases, tasks, invitations, members) still works through the new UI.
- No horizontal overflow at 375/768/1024/1440; keyboard navigation and
  visible focus everywhere; reduced-motion disables animation.
- All Web gates green: `api:check`, `lint`, `typecheck`, `test`, `build`,
  `test:e2e`, `test:a11y`, `performance:check`, `licenses:check`.
- Gherkin journeys verified in Chrome against the local stack.

## Edge cases

- No session → `/login`; no household → `/onboarding`.
- No plan → empty week state with create action; empty week day slots render
  dashed placeholders.
- Unknown/forward-compatible activity `kind` renders a generic label.
- Long recipe/ingredient names truncate without breaking rows.
- API down → inline error state per surface, not a blank page.
- Stale `expected_version` (409) surfaces a conflict message.
- Sidebar badge for pending shopping count only when >0.

## Out of scope

- API contract changes; new backend endpoints; real email delivery; deploy.

## Measurable outcomes

- 100% of `(app)` routes render the new shell; Lighthouse/axe a11y clean;
  Gherkin scenarios documented and browser-verified; zero console errors on
  the exercised flows.

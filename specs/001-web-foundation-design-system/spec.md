# Feature Specification: Web Foundation and Design System

**Feature Branch**: `001-web-foundation-design-system`

**Created**: 2026-09-08

**Status**: Draft

**Input**: Establish the Dockerized Next.js frontend foundation, Uribap design system, generated API client boundary, accessibility baseline, and testing tooling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a Coherent Uribap Shell (Priority: P1)

As a household member opening Uribap, I need a calm, recognizable and responsive application
shell so that I understand where the product's core tasks will live before domain data is added.

**Why this priority**: The shell is the shared interaction foundation for every future feature
and must establish the product identity without locking in placeholder data.

**Independent Test**: A reviewer opens the frontend at desktop and mobile widths, identifies the
brand, primary navigation structure, content region, responsive navigation, focus state, and
empty/loading treatment without needing a backend account.

**Acceptance Scenarios**:

1. **Given** the frontend is opened without domain data, **When** the shell is viewed at desktop
   and mobile widths, **Then** navigation, content hierarchy, and a useful empty state remain
   understandable without horizontal overflow.
2. **Given** a keyboard-only user enters the application, **When** they move through navigation
   and the primary content region, **Then** focus is visible, order is logical, and every
   interactive control has an accessible name.

---

### User Story 2 - Use One Consistent Uribap Visual Language (Priority: P1)

As a product designer and frontend contributor, I need shared tokens and accessible primitives
so that future dashboard, planner, inventory, shopping, and preparation surfaces feel like one
intentional product rather than unrelated screens.

**Why this priority**: The Open Design reference already establishes a direction; encoding it as
reusable rules prevents visual drift and reduces one-off component code.

**Independent Test**: A reviewer can inspect the foundation specimen and identify typography,
spacing, surfaces, semantic states, controls, icon treatment, responsive rules, motion rules,
and reduced-motion behavior without reading implementation internals.

**Acceptance Scenarios**:

1. **Given** a contributor adds a new interactive surface, **When** they use the foundation
   primitives and tokens, **Then** common states and visual hierarchy remain consistent with
   Uribap's calm household-operations direction.
2. **Given** reduced motion is requested, **When** the same shell and interaction states are
   viewed, **Then** information and state changes remain available without non-essential motion.

---

### User Story 3 - Consume the Backend Boundary Safely (Priority: P1)

As a frontend contributor, I need a generated client from the pinned API contract so that Web
features consume the backend without reimplementing request types or domain calculations.

**Why this priority**: The public Web and API repositories must evolve independently without
silently diverging on errors, quantities, authentication, or projection responses.

**Independent Test**: A contributor updates the pinned contract snapshot, regenerates the client,
runs type and contract checks, and observes a clear failure when the snapshot is stale or invalid.

**Acceptance Scenarios**:

1. **Given** a valid pinned API contract, **When** the client generation and type checks run,
   **Then** the generated surface is reproducible and exposes the documented error/quantity
   shapes without hand-written duplicate DTOs.
2. **Given** an API request is loading, empty, rejected, unauthorized, or succeeds, **When** a
   foundation consumer renders it, **Then** the state contract has an intentional UI treatment
   and does not expose credentials or raw internal errors.

---

### Edge Cases

- The API is unavailable, slow, returns malformed data, or reports an incompatible contract.
- A route is loaded directly, refreshed, or opened at a narrow mobile viewport.
- A long household name, recipe name, quantity, error message, or localized label wraps.
- A user has reduced-motion enabled or cannot use a pointing device.
- A third-party icon, font, or animation dependency fails to load.
- The shell has no recipes, meals, inventory, shopping items, preparation tasks, or events yet.
- A client-side interaction is interrupted by navigation or a concurrent server response.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST provide a documented, repeatable path to run the frontend locally
  and in a container using non-secret environment configuration.
- **FR-002**: The application MUST expose a responsive Uribap shell with brand, primary
  navigation, content region, mobile navigation behavior, and deep-link-safe route structure.
- **FR-003**: The visual system MUST define reusable semantic tokens for surfaces, text hierarchy,
  borders, focus, brand accent, success, warning, missing, frozen, and projected states.
- **FR-004**: The visual system MUST define typography, spacing, radius, elevation, icon, control,
  breakpoint, and motion guidance derived from the approved Open Design direction.
- **FR-005**: The foundation MUST provide accessible primitives or wrappers for buttons, links,
  dialogs, menus, tabs, form fields, status messaging, and loading/empty/error states.
- **FR-006**: The foundation MUST provide a generated client boundary based on a pinned API
  contract snapshot and MUST fail validation when the generated output or snapshot is stale.
- **FR-007**: The frontend MUST keep domain calculations in the API and MUST not calculate
  inventory, forecasting, shopping, preparation, or confirmed consumption in UI code.
- **FR-008**: The application MUST define server/client ownership for data fetching, mutations,
  browser APIs, local interaction state, and motion so private data is not shared accidentally.
- **FR-009**: Every foundation data consumer MUST define loading, empty, error, success,
  unauthorized/permission, stale/conflict, and unavailable-service treatments where relevant.
- **FR-010**: Interactive controls MUST be keyboard operable, visibly focused, correctly named,
  touch-usable, and compatible with reduced-motion preferences.
- **FR-011**: Motion MUST be purposeful, interruptible, compositor-friendly, and optional; it MUST
  not block navigation or be the only channel for communicating state.
- **FR-012**: The foundation MUST include component, accessibility, responsive, and end-to-end
  validation paths suitable for future domain features.
- **FR-013**: The frontend MUST avoid food/product image storage and MUST function without image
  assets.
- **FR-014**: The foundation MUST establish measurable performance budgets for the shell, bundle,
  layout stability, and interaction responsiveness.

### Key Entities

- **Application shell**: Shared navigation, route frame, content region, and responsive behavior.
- **Design token set**: Semantic visual values and usage rules shared across features.
- **UI primitive**: Accessible reusable control with defined states and interaction contract.
- **API contract snapshot**: Pinned backend boundary from which the client is generated.
- **View state**: Loading, empty, error, success, permission, stale/conflict, and unavailable
  states that a feature may render.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor can start the frontend from a clean checkout using the documented
  local path in 5 minutes or less after prerequisites are installed.
- **SC-002**: At 375, 768, 1024, and 1440px widths, the foundation shell has no unintended
  horizontal scrolling and preserves readable navigation/content hierarchy.
- **SC-003**: Automated accessibility checks report zero critical or serious violations on the
  foundation shell and its representative primitive states.
- **SC-004**: Keyboard-only review reaches every shell control and returns focus correctly from
  each foundation overlay without requiring a pointer.
- **SC-005**: The contract snapshot and generated client produce no diff when regenerated twice
  from the same pinned API revision.
- **SC-006**: The production shell meets the agreed budgets of LCP under 2.5s, CLS under 0.1,
  and INP under 200ms on the project test profile.
- **SC-007**: The frontend container builds and serves the same route shell as the local/Vercel
  build without requiring secrets or food/product image assets.

## Assumptions

- The initial foundation may use a documented placeholder API contract until `uribap-api`
  publishes its first canonical contract; the snapshot must be clearly versioned.
- Authentication UI and household onboarding belong to the next Web spec, but the shell must
  leave room for protected-route/session integration.
- The Open Design HTML is the visual reference, not a production dependency or source file.
- Spanish-neutral copy is the initial interface language; locale selection is a later domain flow.
- No SEO, public marketing pages, food photography, or product photography is required for the
  authenticated product shell.

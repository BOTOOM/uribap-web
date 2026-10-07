# Feature Specification: Meal Detail Modal

**Feature Branch**: `devin/1791403355-meal-detail-modal`

**Created**: 2026-10-07

**Status**: Approved

**Input**: User description: “Show a meal's detail in a modal instead of an inline panel under the week grid, and let users open today's or tomorrow's meal from the home page without navigating away.”

## User Scenarios & Testing

### User Story 1 - Inspect a planned meal from the week board (Priority: P1)

As a household member planning or preparing meals, I want to open a meal's existing recipe detail in a dialog from its plan card, so I can inspect it without losing my place in the week grid.

**Why this priority**: The plan board is the existing entry point for meal details, and replacing its inline panel directly addresses the disruptive scroll-to-detail-and-back flow.

**Independent Test**: Render the plan board with entries, confirm that mounting it does not fetch a detail or open a dialog, then select a card and verify its existing detail appears in a labelled dialog.

**Acceptance Scenarios**:

1. **Given** a plan board with one or more meals and no active selection, **When** the board mounts, **Then** no detail request is made and no dialog is open.
2. **Given** a meal card on the board, **When** the user activates it, **Then** the matching meal detail opens in a dialog and the card indicates selection only while the dialog is open.
3. **Given** the dialog is open, **When** the user presses Escape or activates its close button, **Then** the dialog closes and focus returns according to the existing dialog behavior.
4. **Given** a meal detail dialog is closed, **When** the user changes the selected day, **Then** the day changes without opening or selecting a meal.
5. **Given** an open meal is removed from refreshed plan data, **When** the board receives the updated entries, **Then** the dialog closes instead of showing stale detail.

### User Story 2 - Inspect today's or tomorrow's meal from home (Priority: P1)

As a household member using the home page, I want to open today's or tomorrow's meal directly from its row, so I can see the recipe without navigating to the plan page.

**Why this priority**: The home page is the quickest glanceable view of the next meals, and its current rows do not open any detail.

**Independent Test**: Render home meal rows with cooked, skipped, and pending outcomes, verify their labels, activate a row, and confirm the matching detail is fetched and shown in a dialog.

**Acceptance Scenarios**:

1. **Given** a home row for a planned meal, **When** the user activates the row, **Then** its existing meal detail opens in a dialog without changing routes.
2. **Given** a row with a recorded cooked completion, **When** it is rendered, **Then** it shows “Cocinada” with the completed treatment and check icon.
3. **Given** a row with a recorded skipped completion, **When** it is rendered, **Then** it shows the neutral “Domicilio” status.
4. **Given** a row without a recorded completion, **When** it is rendered, **Then** it shows the available “Planeada” status.
5. **Given** there is no plan or no row for the requested day, **When** the home section renders, **Then** it shows its existing empty label and no meal dialog can open.
6. **Given** the “Mañana” section is rendered, **When** the user chooses “Ver detalle”, **Then** that existing link continues to navigate to the plan page.

### Edge Cases

- A day with no entries remains in its existing empty state; changing to it does not select another day's meal.
- A selected entry missing from refreshed data yields no dialog target, even while other entries remain.
- Cooked/skipped completion metadata can change while a dialog is open; the target's completion version participates in the detail refresh key so the existing detail component can reload.
- A home section can lack plan metadata; its empty state must not fabricate a plan ID or mount an interactive dialog.
- The existing detail component retains its loading, error, retry, and action states inside the dialog.
- Long details and footer actions remain reachable by scrolling the dialog, including on mobile with a safe-area inset.

## Requirements

### Functional Requirements

- **FR-001**: The plan board MUST begin with no meal selected and MUST NOT fetch a meal detail until a user opens a meal card.
- **FR-002**: Activating a plan meal card MUST open that entry's existing detail in a labelled dialog.
- **FR-003**: The day picker MUST change the active day without choosing or opening a meal.
- **FR-004**: A plan card MUST expose that it opens a dialog, and its selected visual state MUST be present only while its dialog is open.
- **FR-005**: Closing the detail dialog by Escape, the close button, or the dialog's normal dismiss behavior MUST clear its selected target.
- **FR-006**: A refreshed plan that no longer contains the selected entry MUST close the dialog.
- **FR-007**: Plan and home dialogs MUST render the existing `MealEntryDetail` behavior; this feature MUST NOT change its fetching, action, retry, or view logic.
- **FR-008**: The detail refresh key MUST include the entry ID, outcome (or pending marker), and completion version (or none marker).
- **FR-009**: Today's and tomorrow's home meal rows MUST be keyboard-operable buttons that open the matching meal detail without route navigation.
- **FR-010**: Home rows MUST present recorded cooked, recorded skipped, and pending states as “Cocinada”, “Domicilio”, and “Planeada”, respectively.
- **FR-011**: The home page MUST derive completion labels from recorded server completion data; it MUST NOT infer or mutate meal outcomes in the browser.
- **FR-012**: Home sections without a plan or without entries MUST show their provided empty label and MUST NOT open a dialog.
- **FR-013**: The existing “Ver detalle” link in the Mañana section MUST remain unchanged.
- **FR-014**: The detail dialog MUST have an accessible name, visible close control, keyboard dismissal, focus-visible support, and reduced-motion-compatible animation.
- **FR-015**: The desktop dialog MUST fit within the viewport at a maximum width of 920px; at the existing mobile breakpoint it MUST behave as a bottom sheet, avoid horizontal overflow, respect the safe area, and keep detail actions reachable.
- **FR-016**: This feature MUST NOT change the API contract, home date/loading logic, plan detail fetch/actions, or unrelated dashboard content.

### Key Entities

- **Meal detail target**: Transient UI state identifying an entry and its current completion outcome/version; `null` represents a closed detail dialog.
- **Home meal row**: A server-projected entry summary containing meal label, recipe name, servings, and recorded outcome/version used to render and open its detail.
- **Plan context**: The existing plan ID, plan state, and version passed to the shared detail dialog; it is absent for an empty home section without a plan.

## Success Criteria

### Measurable Outcomes

- **SC-001**: With a populated plan board, initial render causes zero detail endpoint requests; activating a card causes one request for that entry.
- **SC-002**: From either today's or tomorrow's home row, a user can open the corresponding recipe in a dialog without a route change.
- **SC-003**: Component tests verify all three completion labels, no-plan/empty behavior, close behavior, and day-picker behavior.
- **SC-004**: An axe check reports no serious or critical violations for the open meal-detail dialog.
- **SC-005**: The plan-detail E2E assertion verifies a visible dialog and no horizontal overflow at its existing 375px and 1440px viewports.
- **SC-006**: The dialog remains scrollable and its footer actions are reachable at mobile and desktop viewport sizes.

## Assumptions

- The existing `MealEntryDetail` component and authenticated detail endpoint remain authoritative for detail content and action outcomes.
- Server Components continue to load plan, entry, and recorded completion data; the new client components receive serializable projections.
- `null` plan context is represented explicitly for a home section without a plan, so no placeholder plan ID or state is required.
- The existing Radix `Dialog` wrapper supplies modal focus management, Escape handling, and focus return.
- The feature does not alter date selection or data-loading behavior on the home page.

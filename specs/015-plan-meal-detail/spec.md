# Feature Specification: Plan Meal Detail, Delivery Skip, and Completion History

**Feature Branch**: `devin/1790820038-plan-meal-detail`

**Created**: 2026-10-01

**Status**: Ready for implementation

**Input**: Improve the weekly plan so a household member can inspect recipe ingredients and preparation, distinguish cooked meals from meals ordered for delivery, and review completion history clearly.

## User Scenarios & Testing

### User Story 1 - Inspect a planned meal before preparing it (Priority: P1)

A household member selects a meal on the weekly plan and sees its recipe description, preparation steps, required ingredients, and current availability in a readable layout. The plan opens on the first pending meal for today when possible, and dates reflect the household's timezone.

**Why this priority**: Meal information is the primary reason a member opens the plan; the current impact summary does not help them decide how to prepare the meal.

**Independent Test**: Render a plan with pending, cooked, and skipped meals, select a meal, and verify its recipe, ingredient amounts, availability, steps, and outcome-specific explanation.

**Acceptance Scenarios**:

1. **Given** today's plan includes pending meals, **When** the plan opens, **Then** the first pending meal in meal order is selected and its detail is shown.
2. **Given** a member selects another day's tab, **When** that day has meals, **Then** its first meal is selected; when it has none, no meal is selected.
3. **Given** a member selects a meal card, **When** its detail is shown, **Then** ingredients, optional labels, API-provided quantities and availability, preparation steps, and notes are rendered without client-side inventory calculations.
4. **Given** the household date differs from UTC, **When** the plan loads, **Then** its default week and today state use the household timezone, with a UTC fallback if household data or the timezone is invalid.
5. **Given** a meal has no recorded completion, **When** its detail is shown, **Then** its API-provided shortfall or available amount is shown; recorded meals explain the relevant inventory effect instead.

### User Story 2 - Record a meal as cooked or ordered for delivery (Priority: P1)

A member with an approved plan can record that a meal was cooked or that the household ordered delivery. A delivery skip records the outcome and optional note without changing inventory.

**Why this priority**: A delivery meal must not be falsely represented as cooked or deducted from household stock.

**Independent Test**: For an approved pending entry, complete it as cooked or submit the skip form, then verify the outcome-specific request, status, and refresh behavior, including conflict recovery.

**Acceptance Scenarios**:

1. **Given** an approved pending meal, **When** it is marked cooked, **Then** it is displayed as cooked and the API owns its inventory deduction.
2. **Given** an approved pending meal, **When** a member confirms delivery with an optional reason, **Then** a skipped completion is recorded and inventory is unchanged.
3. **Given** the skip request conflicts with a newer server state, **When** the response is a conflict, **Then** the member sees the error and a reload action.
4. **Given** an approved meal already has a recorded completion, **When** its detail is opened, **Then** the existing completion can be reopened rather than completed or skipped again.
5. **Given** a meal plan is a draft, proposed, or archived plan, **When** its detail is opened, **Then** actions follow the plan's existing edit and approval rules.

### User Story 3 - Review recorded, skipped, and reopened meals (Priority: P1)

A household member reviews recent meal records as styled cards, distinguishes cooked, delivery, and reopened outcomes, and can correct recorded cooked ingredient amounts or reopen a recorded completion.

**Why this priority**: The history is the audit trail for what was cooked, skipped, or subsequently reopened and must remain understandable on a phone.

**Independent Test**: Render cooked, skipped, and reopened completion fixtures and verify their labels, notes, ingredient details, correction controls, and reopen actions.

**Acceptance Scenarios**:

1. **Given** a cooked completion, **When** it appears in history, **Then** its ingredients are expandable and show actual amounts with planned amounts when they differ.
2. **Given** a skipped completion, **When** it appears in history, **Then** it is labeled as delivery and shows its note or the no-inventory-change fallback.
3. **Given** a reopened completion, **When** it appears in history, **Then** it is visually muted, labeled reopened, and shows the reopen reason when present.
4. **Given** a recorded cooked completion, **When** its lines are shown, **Then** each line may be corrected and the completion may be reopened.
5. **Given** completion history cannot be loaded, **When** the plan page renders, **Then** an accessible error remains visible.

## Requirements

### Functional Requirements

- **FR-001**: The plan MUST display a selected meal's API-provided recipe name, description, preparation time, servings, notes, ingredient names, required amounts, units, optional state, on-hand amount, shortfall, and completion details.
- **FR-002**: The Web client MUST format decimal amounts with the existing `formatQuantity` helper and MUST NOT calculate scaling, availability, shortages, or inventory effects.
- **FR-003**: The plan MUST derive today and its default/current week from the active household timezone; it MUST fall back to the existing UTC date when household loading fails or the timezone is invalid.
- **FR-004**: The plan board MUST distinguish pending, cooked, and skipped meal outcomes, select today's first pending meal in meal order by default, and select a day's first meal when its day tab is activated.
- **FR-005**: An approved pending meal MUST offer cooked and delivery-skip actions. A skip MAY include a reason of at most 2,000 characters and MUST leave inventory unchanged.
- **FR-006**: The skip request MUST forward an `Idempotency-Key`, show pending/error/conflict states, provide reload after a conflict, and refresh server state after success.
- **FR-007**: Meal actions MUST follow plan state: draft entries retain removal controls; approved pending entries offer cooked/skip; approved recorded entries offer reopen; proposed plans explain approval is required; archived plans expose no mutation.
- **FR-008**: Meal detail MUST explain cooked and skipped inventory effects, render empty-ingredient and missing-preparation states, and split numbered recipe steps from the API description.
- **FR-009**: Completion history MUST distinguish cooked, skipped, and reopened records; cooked ingredient lines MUST be expandable and correctable only while recorded.
- **FR-010**: The plan and completion history MUST remain keyboard accessible and responsive without horizontal overflow at a 375px viewport.
- **FR-011**: The interface MUST retain the existing Uribap tokens, cards, status labels, typography, and reduced-motion behavior.
- **FR-012**: API interactions MUST use generated types from the pinned API OpenAPI snapshot and must preserve BFF authentication boundaries.

## Edge Cases

- No meal is selected: show a muted prompt instead of the removed impact-panel series.
- Today has no plan entries: default selection falls back to the first entry for today, then no selection.
- A selected day is empty: clear selection.
- A recipe has no ingredients or has no preparation description: render the specified muted fallback.
- A recipe step is separated by a blank line or prefixed with a number, dash, or bullet: trim empty lines and remove only the leading marker.
- A recorded cooked or skipped completion must not show pending ingredient availability.
- An invalid household timezone or failed household request must not break plan loading.
- A skip request returns HTTP 409: retain the error and offer an explicit reload action.
- Completion history fails to load: keep a `role="alert"` error within the section.
- Correcting a completion line must fit within the history card at mobile widths.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A member can inspect recipe ingredients and preparation directly from a selected plan entry without relying on the previous impact summary.
- **SC-002**: A skipped delivery meal is visibly distinct from a cooked meal and does not trigger a client-side inventory deduction.
- **SC-003**: The current household-local day is selected correctly for the specified Bogotá UTC-boundary example.
- **SC-004**: Cooked, skipped, and reopened completion records have distinct labels and appropriate line-level actions.
- **SC-005**: The plan detail and history fit at 375px with no horizontal overflow and remain operable with keyboard controls.

## Assumptions

- The API feature on `devin/1790817968-exclude-completed-forecast` provides the detail and skip endpoints, outcome fields, and completion projections defined in the authoritative design.
- The generated API contract is copied from the post-dependency API branch head, with schema version `v13`.
- Component and unit accessibility tests are the default verification scope. `e2e/plan-detail.spec.ts` is opt-in behind `RUN_PLANNING_E2E=1` and an authenticated local API stack, so it is skipped by default. No Docker or live identity-provider check is required; the lead will perform the rendered four-viewport review on the local preview after push.

## Out of Scope

- Implementing API persistence, inventory calculations, forecasting changes, new API behavior, or migrations.
- Replacing existing meal-plan or completion workflows beyond the described detail, skip, and history experience.

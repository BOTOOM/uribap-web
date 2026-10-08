# Feature Specification: Pantry Staple Ingredients

**Feature Branch**: `devin/1791246997-pantry-staples`

**Created**: 2026-10-06

**Status**: Implementation complete

**Input**: Keep spices, salt, oil, and similar pantry staples in recipes without treating them as consumed stock; show them in shopping only after the API reports they are out of stock.

## User Scenarios & Testing

### User Story 1 - Mark a household ingredient as a pantry staple (Priority: P1)

A household member creates or edits an ingredient and can identify it as a pantry staple. The choice is saved through the authenticated BFF and is available again when the ingredient is listed or edited.

**Why this priority**: A household must be able to record the staple policy on its ingredients before recipe, plan, and forecast views can explain it.

**Independent Test**: Submit the create and edit forms with the checkbox checked, verify the respective payloads, and render a persisted flagged ingredient.

**Acceptance Scenarios**:

1. **Given** a household member creates an ingredient, **When** the form opens, **Then** the pantry-staple checkbox is unchecked unless explicitly selected.
2. **Given** a member selects “Básico de despensa”, **When** the form is submitted, **Then** the create or update request includes `pantry_staple: true`.
3. **Given** a member edits an ingredient, **When** the dialog opens, **Then** its checkbox reflects the API response and can be changed.
4. **Given** a global ingredient is listed, **When** its row is rendered, **Then** it remains read-only and has no edit control.

### User Story 2 - Recognize pantry staples in the ingredient catalog (Priority: P1)

A household member can distinguish flagged household ingredients in the ingredient list without opening the edit form.

**Why this priority**: The catalog is the source for managing ingredient policy and should make the saved flag easy to audit.

**Independent Test**: Render flagged, unflagged, and global ingredient rows and verify that only flagged ingredients show the “Básico” badge and household ingredients remain editable.

**Acceptance Scenarios**:

1. **Given** an ingredient has `pantry_staple: true`, **When** it appears in the catalog, **Then** its row displays the “Básico” badge.
2. **Given** an ingredient has `pantry_staple: false`, **When** it appears in the catalog, **Then** no “Básico” badge is shown.
3. **Given** an ingredient is global, **When** it appears in the catalog, **Then** the UI does not offer an edit action.

### User Story 3 - Explain staple stock in plan detail and forecast (Priority: P1)

A household member inspecting a planned meal or forecast can tell that a stocked ingredient is a pantry staple, and can tell when a staple has run out.

**Why this priority**: The API preserves staple recipe demand while applying special completion and shopping behavior; the UI must explain that state without rebuilding inventory logic.

**Independent Test**: Render API fixtures for stocked and out-of-stock staples alongside non-staples in meal detail and forecast rows.

**Acceptance Scenarios**:

1. **Given** a staple has no positive API shortfall, **When** it appears in plan detail or forecast, **Then** it displays “Básico de despensa” instead of the normal available/covered label.
2. **Given** a staple has positive API shortfall, **When** it appears in plan detail or forecast, **Then** it displays “Se acabó”.
3. **Given** an ingredient is not a staple, **When** it appears in plan detail or forecast, **Then** the existing available, covered, or missing display remains unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The Web client MUST use the generated OpenAPI contract from API revision `e0e347a68ed7c9a3e386645e7058636897b8d567`, schema version `v15`.
- **FR-002**: Ingredient create and edit forms MUST expose an accessible “Básico de despensa” checkbox with help text “No se descuenta al cocinar. Aparece en compras solo cuando se acaba.”
- **FR-003**: The create form MUST send `pantry_staple` as a Boolean defaulting to `false`; the edit form MUST initialize from the API response and send changes through the authenticated BFF.
- **FR-004**: The ingredient catalog MUST show a “Básico” badge for flagged ingredients and MUST keep global ingredients read-only.
- **FR-005**: Plan-detail ingredient rows MUST show “Básico de despensa” for a staple without positive API shortfall and “Se acabó” for a staple with positive API shortfall.
- **FR-006**: Forecast rows MUST show the same staple labels, based only on `pantry_staple` and API-provided `shortfall_amount`.
- **FR-007**: Existing non-staple labels, forecast content, loading/error handling, and keyboard behavior MUST remain intact.
- **FR-008**: The client MUST NOT calculate staple stock, shortfall, consumption, or shopping quantities.
- **FR-009**: The forms and row labels MUST remain understandable at mobile widths and expose their state through semantic text and accessible names.
- **FR-010**: Cooked-meal detail MUST explain that only consumable ingredients are deducted and pantry staples are not.

### Success Criteria

- **SC-001**: Create and edit component tests prove the checkbox state is initialized correctly and the selected Boolean is sent to the correct BFF method.
- **SC-002**: Flagged household ingredient rows show “Básico”; unflagged and global rows do not receive a misleading badge or edit action.
- **SC-003**: Plan and forecast component tests cover stocked staples, out-of-stock staples, and unchanged non-staple rendering.
- **SC-004**: The generated Web client passes `pnpm api:check`, and the Web contract snapshot is byte-identical to the API branch contract.
- **SC-005**: Lint, typecheck, touched component tests, and production build pass.
- **SC-006**: Cooked-meal detail does not claim that pantry staples were deducted.

## Assumptions

- API branch `devin/1791246997-pantry-staples` is pushed at revision `e0e347a68ed7c9a3e386645e7058636897b8d567`; it supplies the create/update/response fields and projection fields used here.
- The ingredient list may contain global rows. Those rows remain read-only; editing is offered only for household-owned ingredients.
- `shortfall_amount` is the API-owned signal for “Se acabó”; React does not infer stock from required or on-hand amounts.

## Out of Scope

- API persistence, completion, forecast, shopping-list, inventory-adjustment, or migration behavior.
- Recomputing on-hand stock or shopping quantities in the Web application.
- Editing ingredient dimensions or base units.

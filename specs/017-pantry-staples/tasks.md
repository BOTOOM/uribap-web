# Tasks: Pantry Staple Ingredients

**Input**: Design documents from `specs/017-pantry-staples/`

**Prerequisites**: `plan.md`, `spec.md`, `contracts/pantry-staples.md`

**Tests**: Write the focused component regressions before implementing the form, catalog, or projection changes.

**Organization**: Pin and generate the API contract first; all user-facing changes depend on its v15 types.

## Phase 1: Setup

**Purpose**: Pin the API contract and generate the feature's TypeScript boundary.

- [x] T001 Copy the API pantry-staples OpenAPI snapshot, regenerate `src/lib/api/generated/schema.ts`, and update `contracts/metadata.json` plus its unit assertion to API revision `e0e347a68ed7c9a3e386645e7058636897b8d567`, schema `v15`, and date `2026-10-06`.

---

## Phase 2: Tests First

**Purpose**: Capture create/edit payload, catalog, and projection behavior before changing components.

- [x] T002 [P] Add ingredient-form tests for the default checkbox, exact Spanish help text, create payload, edit initialization, PATCH payload, and accessible API error.
- [x] T003 [P] Add ingredient-table tests for “Básico” badge visibility and edit availability only for household-owned rows.
- [x] T004 [P] Extend plan-detail tests for stocked/out-of-stock and recorded-meal staple labels, accurate cooked-state copy, and unchanged non-staple labels.
- [x] T005 [P] Extend forecast tests for stocked/out-of-stock staple labels and unchanged non-staple labels.

---

## Phase 3: Implement the Ingredient Setting

**Purpose**: Expose the flag through household ingredient create and edit workflows.

- [x] T006 Generalize the ingredient create form into `IngredientForm`, add the checkbox/help text and typed `pantry_staple` payload, and preserve create callers.
- [x] T007 Add the authenticated `PATCH /api/ingredients/[ingredientId]` BFF route and an edit dialog that initializes from the response, refreshes after success, and preserves error behavior.
- [x] T008 Type ingredient list data from the generated response, show the “Básico” badge, and expose edit controls only for household ingredients.

---

## Phase 4: Explain Staple State

**Purpose**: Render API-owned pantry staple state in plan detail and forecast.

- [x] T009 Render “Básico de despensa” or “Se acabó” from the API staple and shortfall fields in plan detail and forecast; preserve all non-staple output.
- [x] T010 Add compact badge and checkbox help styling that remains readable and keyboard-accessible on mobile.

---

## Phase 5: Verify and Converge

**Purpose**: Run the requested Web gate, record the result, and deliver the branch.

- [x] T011 Run lint, typecheck, focused component/API-contract tests, API generation check, production build, `git diff --check`, and final API/OpenAPI `cmp`; complete convergence notes.
- [ ] T012 Commit and push the feature branch; record the final SHA and diff stat.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Generate the v15 contract before tests or UI implementation.
- **Tests First (Phase 2)**: T002–T005 must precede T006–T010.
- **Ingredient Setting (Phase 3)**: The client form and list consume the generated contract.
- **Projection Labels (Phase 4)**: Plan detail and forecast consume the generated response fields.
- **Verify and Converge (Phase 5)**: Run after the final product and artifact edits.

### Parallel Opportunities

- T002–T005 touch separate component-test files and can be authored in parallel after T001.
- T006–T008 touch different form, route, and page/table surfaces after their tests are in place.
- T009 can be implemented independently of the ingredient create/edit flow after the generated contract is available.

## Implementation Strategy

1. Pin and generate the API v15 contract.
2. Write create/edit, catalog, plan-detail, and forecast regressions.
3. Implement the form/BFF/catalog and API-projected status labels.
4. Run the narrow verification plan, record convergence, then commit and push.

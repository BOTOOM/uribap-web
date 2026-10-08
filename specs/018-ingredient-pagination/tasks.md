# Tasks: Complete Ingredient Listings

**Input**: Design documents from `specs/018-ingredient-pagination/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ingredient-listing.md`, `quickstart.md`

**Tests**: Add the focused helper regressions before implementing the helper. Update the contract test with the API snapshot.

**Organization**: Tasks are grouped by user story after shared contract and helper work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel on different files without dependencies on unfinished tasks.
- **[Story]**: Maps page integration tasks to the user stories in `spec.md`.
- Paths below are relative to the Web repository root.

## Phase 1: Setup — Pin the API Contract

**Purpose**: Generate the typed Web contract from the pushed API pagination revision.

- [X] T001 Copy API revision `74b661925fdec990c386850b90906664bb78b74f` into `contracts/uribap-api.openapi.json`, update `contracts/metadata.json` to v16 and `2026-10-06`, then run `pnpm api:generate` for `src/lib/api/generated/schema.ts`.
- [X] T002 [P] Update `tests/unit/api-contract.test.ts` to assert the API revision, v16 metadata, ingredient cursor parameter, and typed `IngredientPage.page_info`.

---

## Phase 2: Foundational — Add Shared Pagination

**Purpose**: Establish and test the common server-side listing behavior required by both user stories.

- [X] T003 [P] Add `tests/unit/api/list-all-ingredients.test.ts` coverage for single- and three-page traversal, continuation failure without partial results, page-cap overflow, URL encoding, and preserving extra query parameters.
- [X] T004 Implement server-only `listAllIngredients(path = "/ingredients")` in `src/lib/api/list-all-ingredients.ts`, resolving the household once with `getActiveHouseholdId()` and fetching pages through `serverApiFetch` with an explicit `X-Household-ID`, `limit=100`, encoded cursors, preserved extra parameters, and a throwing 50-page cap.

**Checkpoint**: The shared helper passes its focused tests before either page group is migrated.

---

## Phase 3: User Story 1 — Complete Catalog and Inventory (Priority: P1) 🎯 MVP

**Goal**: Household members can use the complete ingredient catalog and inventory without missing names or entries.

**Independent Test**: With 140 visible ingredients, verify that catalog and inventory list all 140 once and resolve each name correctly.

### Tests for User Story 1

The helper tests in Phase 2 cover continuation behavior. Preserve the existing page-level error handling while replacing only the loader's one-page ingredient request.

### Implementation for User Story 1

- [X] T005 [P] [US1] Replace the one-page ingredient fetch with `listAllIngredients` in `src/app/(app)/ingredientes/page.tsx` while preserving its existing error-object and error-state behavior.
- [X] T006 [P] [US1] Replace the one-page ingredient fetch with `listAllIngredients` in `src/app/(app)/inventario/page.tsx` while preserving its empty-list fallback and inventory-row name resolution.

**Checkpoint**: Catalog and inventory use the full ordered result and keep their existing empty/error states.

---

## Phase 4: User Story 2 — Resolve Meal and Recipe Ingredients (Priority: P1)

**Goal**: Plan, preparation, and recipe views correctly resolve ingredients beyond the first 100 catalog entries.

**Independent Test**: Place an ingredient after the first 100 catalog entries into plan, preparation, and recipe data, then verify each view receives and displays the correct ingredient record.

### Tests for User Story 2

The shared helper tests cover multi-page and failure behavior; retain each page's existing local fallback when integrating it.

### Implementation for User Story 2

- [X] T007 [P] [US2] Use `listAllIngredients` in the ingredient loader in `src/app/(app)/plan/page.tsx`, preserving its existing mapping and empty-list fallback.
- [X] T008 [P] [US2] Use `listAllIngredients` in the ingredient loader in `src/app/(app)/preparacion/page.tsx`, preserving its existing type projection and empty-list fallback.
- [X] T009 [P] [US2] Use `listAllIngredients("/ingredients?limit=100")` in `src/app/(app)/recetas/[recipeId]/page.tsx`, preserving its existing empty-list fallback.

**Checkpoint**: Plan, preparation, and recipe views resolve all catalog ingredients without changing their surrounding behavior.

---

## Phase 5: Polish and Converge

**Purpose**: Validate the feature, record evidence, and deliver the Web branch.

- [X] T010 Run the focused helper and API-contract tests, lint, typecheck, `pnpm api:check`, production build, and `/uribap-web-testing`; compare `contracts/uribap-api.openapi.json` with the API revision and run `git diff --check`.
- [X] T011 Record executed and skipped checks, results, and any concrete blockers in `specs/018-ingredient-pagination/converge.md`.
- [X] T012 Commit the feature files and push `devin/1791307670-ingredient-pagination`, leaving the untracked `src/app/dev-preview/` directory untouched and unstaged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pin and generate the API contract before using its cursor type.
- **Foundational (Phase 2)**: T003 precedes T004; the helper is shared by both user stories.
- **User Stories (Phases 3–4)**: Both depend on the completed helper and can then be migrated independently.
- **Polish (Phase 5)**: Runs after all five page loaders and the helper are complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after the shared helper; can be tested independently with catalog/inventory fixture data.
- **User Story 2 (P1)**: Starts after the shared helper; can be tested independently with a plan, preparation task, and recipe referencing a late-page ingredient.
- The stories are separate page groups and can be implemented in parallel after Phase 2.

### Parallel Opportunities

- T002 and T003 touch separate test files after T001.
- T005 and T006 touch different page files and can run in parallel after T004.
- T007, T008, and T009 touch different page files and can run in parallel after T004.
- Story 1 and Story 2 page integrations can proceed in parallel after the helper is complete.

## Implementation Strategy

1. Sync the API v16 contract and generate its client types.
2. Add and run helper tests before adding the helper implementation.
3. Implement the common server-only helper.
4. Migrate catalog and inventory loaders, then plan/preparation/recipe loaders.
5. Run the focused checks and `/uribap-web-testing`, record convergence, commit, and push.

## Notes

- Do not edit `src/app/api/ingredients/route.ts`.
- Do not hand-edit `contracts/uribap-api.openapi.json` or `src/lib/api/generated/schema.ts`.
- Do not stage or commit `src/app/dev-preview/`.
- The API contract comparison against API `main` may remain different until the API pagination branch merges; this Web feature must still match its pinned API branch byte-for-byte.

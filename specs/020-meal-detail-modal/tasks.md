# Tasks: Meal Detail Modal

**Input**: Design documents from `specs/020-meal-detail-modal/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, and `contracts/meal-detail-components.md`

**Tests**: Tests are required by the feature brief. Add/update tests before product implementation; run the requested focused suite after all implementation edits.

**Organization**: Tasks are grouped by independently testable user story, followed by shared styling and convergence work.

## Phase 1: Setup and design gate

**Purpose**: Finish the feature package and analyze the design before product code begins.

- [x] T001 Create the feature specification, clarification/research record, implementation plan, UI-only data model, props contract, quickstart, requirements checklist, task list, and analysis/convergence records under `specs/020-meal-detail-modal/`.
- [x] T002 Analyze traceability, client/server boundaries, API authority, accessible dialog behavior, empty/deleted-entry states, and preview reachability; resolve design ambiguities before implementation.

**Checkpoint**: Spec Kit analysis gate passes; no product code begins before this checkpoint.

## Phase 2: User Story 1 — Inspect a planned meal from the week board (Priority: P1)

**Goal**: Open the existing meal detail in a modal from an explicit plan-card activation.

**Independent Test**: Mounting the board makes no detail request; activating a card opens its labelled detail dialog; keyboard or close-button dismissal closes it.

### Tests for User Story 1

- [x] T003 [US1] Update `tests/component/planning/plan-board.test.tsx` for no initial fetch/dialog, card activation and fetched recipe, Escape and close-button dismissal, day-picker non-selection, selection disappearance after refresh, and existing meal creation coverage.
- [x] T004 [US1] Update `e2e/plan-detail.spec.ts` to wait for the visible dialog after selecting a card and assert no horizontal overflow at the existing 375px and 1440px sizes; preserve the current skip gate.

### Implementation for User Story 1

- [x] T005 [US1] Add `src/components/planning/MealDetailDialog.tsx` using the existing Radix wrapper and `MealEntryDetail`; pass the specified ID/outcome/completion-version refresh key without changing detail logic.
- [x] T006 [US1] Update `src/components/planning/PlanBoard.tsx` to start unselected, select only on card activation, leave day-picker actions selection-free, render detail only in the dialog, and remove the inline detail/empty-selection placeholder.

## Phase 3: User Story 2 — Inspect today's or tomorrow's meal from home (Priority: P1)

**Goal**: Open today's or tomorrow's meal detail without a route change and show server-recorded completion state.

**Independent Test**: Render cooked, skipped, and pending rows with correct labels; activate one row to fetch its detail; render the empty label without a dialog when no plan/rows exist.

### Tests for User Story 2

- [x] T007 [P] [US2] Add `tests/component/dashboard/home-meal-list.test.tsx` for row content, servings, cooked/skipped/pending labels, detail request after activation, and empty/no-plan states.
- [x] T008 [US2] Add an axe check for the open meal detail dialog in `tests/accessibility/planning.a11y.test.tsx`; if required for direct jsdom resolution, declare the already-locked `axe-core@4.13.0` as a direct development dependency using pnpm.

### Implementation for User Story 2

- [x] T009 [US2] Add `src/components/dashboard/HomeMealList.tsx` with semantic meal-row buttons, status chips, nullable plan context, and selected-row-derived detail target.
- [x] T010 [US2] Replace `MealRows` in `src/app/(app)/page.tsx` with `HomeMealList` and project only recorded completions; preserve date/loading logic, empty labels, dashboard content, and the “Ver detalle” link.

## Phase 4: Polish and cross-cutting concerns

**Purpose**: Finish responsive styling, local rendered support, and convergence evidence.

- [x] T011 [P] Add the dialog, entry-detail, and meal-row styles to `src/app/globals.css`, including mobile bottom-sheet geometry/animation, safe area, focus-visible ring, and reduced-motion behavior; remove dead `.no-meal-selected` styling.
- [x] T012 Create `src/app/dev-preview/meal-modal/page.tsx` as an untracked local-only fixture with four plan meals, cooked/skipped/pending home rows, and a detail-fetch mock.
- [x] T013 Run the focused tests, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:a11y`, `git diff --check`, and one full `pnpm test` at the end; record results in `converge.md`.
- [x] T014 Start `pnpm dev` on port 3100, verify `/dev-preview/meal-modal` loads without auth, and leave the server running; record the URL and any visual limitation.
- [ ] T015 Commit Spec Kit artifacts before product code, commit the feature separately, explicitly exclude `next-env.d.ts` and `src/app/dev-preview`, then push the feature branch without waiting for CI.

## Dependencies & Execution Order

### Phase dependencies

- **Setup/design gate (Phase 1)** must be complete before tests or product code.
- **US1 and US2 tests** are authored before their corresponding implementation.
- **Shared dialog (T005)** precedes plan-board integration (T006) and home integration (T009).
- **Home server projection (T010)** depends on the HomeMealList props contract and completion-map test.
- **Polish/convergence (Phase 4)** follows both user stories.

### Parallel opportunities

- T003 and T007 touch separate component-test files and can be prepared independently after the design gate.
- T004 and T008 touch separate test suites and can be authored independently.
- Once shared dialog exists, plan-board integration and home-list implementation can proceed in separate files.
- CSS and preview work can proceed after component props and dialog structure are stable.

## Implementation Notes

- The exact verification sequence is documented in `plan.md` and `quickstart.md`.
- Keep the preview source untracked and never stage the `src/app/dev-preview` path.
- The E2E remains gated; do not weaken or remove its existing gate.

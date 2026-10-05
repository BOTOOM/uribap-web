# Tasks: Plan Meal Detail, Delivery Skip, and Completion History

**Input**: Design documents from `specs/015-plan-meal-detail/`

**Prerequisites**: `plan.md`, `spec.md`, `quickstart.md`

**Tests**: Component and unit tests are explicitly required by the design. Write and run each focused test before its corresponding implementation.

**Organization**: Tasks are grouped by user story; contract generation is a shared setup prerequisite.

## Phase 1: Setup

**Purpose**: Pin the API contract and generate the feature's TypeScript boundary.

- [x] T001 Update `contracts/uribap-api.openapi.json`, `contracts/metadata.json`, `src/lib/api/generated/schema.ts`, and `tests/unit/api-contract.test.ts` to API revision `03dcb972b7fdc5a3d341894a80a4eabcebf32605`, schema `v13`, and generated date `2026-10-05`.

---

## Phase 2: Foundational

**Purpose**: Reuse the existing Next.js application, authenticated BFF, API client, and design system; no additional foundation or dependency is required.

---

## Phase 3: User Story 1 — Inspect a planned meal before preparing it (Priority: P1) 🎯 MVP

**Goal**: Open a plan entry to see its API-provided recipe, ingredients, current availability, and preparation details using the household-local date.

**Independent Test**: Render plan fixtures and assert today's default pending selection, day-tab selection, recipe detail, available/missing ingredient state, optional tags, preparation steps, and empty fallbacks.

### Tests for User Story 1

- [x] T002 [P] [US1] Add `todayInTimeZone` tests for the Bogotá boundary case and invalid-zone fallback in `tests/unit/format.test.ts`.
- [x] T003 [P] [US1] Add initial selection, day-tab selection, stay-selected, mobile day label, meal-dot, and accessible tab tests in `tests/component/planning/plan-board.test.tsx`; add the gated detail smoke test in `e2e/plan-detail.spec.ts`.
- [x] T004 [P] [US1] Add `MealEntryDetailView` ingredient, preparation, completion, and plan-state tests in `tests/component/planning/MealEntryDetail.test.tsx`; extend `tests/accessibility/planning.a11y.test.tsx` for pending-approved and cooked detail.
- [x] T005 [US1] Add detail-fetch loading, success, error, and retry tests in `tests/component/planning/MealEntryDetail.test.tsx`.

### Implementation for User Story 1

- [x] T006 [P] Implement `todayInTimeZone` in `src/lib/format.ts`, household-local today/week loading, and mapping of recorded outcomes into entries in `src/app/(app)/plan/page.tsx`.
- [x] T007 [P] Add the authenticated detail GET handler in `src/app/api/plans/[planId]/entries/[entryId]/detail/route.ts`.
- [x] T008 [P] Implement the client fetch wrapper and pure `MealEntryDetailView` in `src/components/planning/MealEntryDetail.tsx`.
- [x] T009 Update `BoardEntry`, initial selection, day-picker selection, and selected-entry rendering in `src/components/planning/PlanBoard.tsx`.

**Checkpoint**: A selected meal renders authoritative recipe detail and can be inspected at household-local dates.

---

## Phase 4: User Story 2 — Record a meal as cooked or ordered for delivery (Priority: P1)

**Goal**: For an approved pending entry, distinguish cooking from delivery and avoid changing inventory for a skipped meal.

**Independent Test**: Verify cooked/skipped card labels, the skip reason payload and idempotency header, success refresh/toast, and a reload affordance after HTTP 409.

### Tests for User Story 2

- [x] T010 [US2] Add cooked and skipped card-label tests in `tests/component/planning/plan-board.test.tsx`.
- [x] T011 [P] [US2] Add max-length, optional-reason payload, idempotency-key, key regeneration, success, and 409 reload tests in `tests/component/planning/SkipMealButton.test.tsx`; extend `tests/accessibility/planning.a11y.test.tsx` for the expanded skip form.

### Implementation for User Story 2

- [x] T012 [P] Implement the skip POST handler and forward `Idempotency-Key` in `src/app/api/plans/[planId]/entries/[entryId]/skip/route.ts`.
- [x] T013 [P] Implement `SkipMealButton` with optional reason, pending/error/conflict state, toast, and refresh in `src/components/planning/SkipMealButton.tsx`.
- [x] T014 Wire cooked, skipped, and pending outcome labels plus state-specific actions in `src/components/planning/PlanBoard.tsx` and `src/components/planning/MealEntryDetail.tsx`.

**Checkpoint**: Approved pending entries can be recorded as cooked or skipped, with API-owned inventory effects.

---

## Phase 5: User Story 3 — Review recorded, skipped, and reopened meals (Priority: P1)

**Goal**: Replace the unstyled inline history with cards that distinguish completion outcomes and expose only valid correction/reopen actions.

**Independent Test**: Render cooked, skipped, and reopened fixtures and assert details, notes, correction permissions, reopen actions, and no inline styles.

### Tests for User Story 3

- [x] T015 [P] [US3] Add cooked, skipped, reopened, correction-only-for-recorded-cooked, reopen-action, and expanded-form inline-style assertions in `tests/component/completion/CompletedMealsList.test.tsx`; extend `tests/accessibility/planning.a11y.test.tsx` for completion history.

### Implementation for User Story 3

- [x] T016 Implement the outcome-aware completion cards in `src/components/completion/CompletedMealsList.tsx`.
- [x] T017 Replace the inline completion-history block with `CompletedMealsList` in `src/app/(app)/plan/page.tsx` and preserve the `loadCompletions` error in a `role="alert"` state.

**Checkpoint**: The completion history explains each outcome and supports correction/reopen only when allowed.

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Finish responsive styling, local review fixtures, and documentation.

- [x] T018 Remove presentation inline styles and keep the expanded correction form mobile-fit in `src/components/completion/CorrectLineForm.tsx`; add planner detail, ingredient, preparation, skip-form, corrected-line, and completed-card styles to `src/app/globals.css`, including rules within the existing 820px breakpoint and reduced-motion compatibility.
- [x] T019 Remove `.impact-panel` and `.impact-cell` styles from `src/app/globals.css` after confirming no other page uses those classes.
- [x] T020 Create realistic Spanish static review fixtures in `src/app/dev-preview/plan/page.tsx`; keep this file untracked and do not stage or commit it.
- [x] T021 Update `specs/015-plan-meal-detail/quickstart.md` and `specs/015-plan-meal-detail/converge.md` with actual checks, preview availability, default E2E skip behavior, and the lead-owned four-viewport rendered-review item left open.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pin the post-dependency API contract and generate types before adding feature tests or components.
- **Foundational (Phase 2)**: No work is required; existing app foundations are reused.
- **User Story 1 (Phase 3)**: Depends on generated v13 contract. Its tests precede implementation.
- **User Story 2 (Phase 4)**: Depends on the detail view and generated cooked/skipped outcome types. Its tests precede skip implementation.
- **User Story 3 (Phase 5)**: Depends on generated completion outcome fields. Its tests precede history implementation.
- **Polish (Phase 6)**: Depends on all user-story components; the preview remains an untracked local file.

### User Story Dependencies

- **US1 (P1)**: API contract setup is required; otherwise independently testable.
- **US2 (P1)**: Uses the plan-detail actions and API outcome contract delivered by US1.
- **US3 (P1)**: Can be implemented independently after contract setup, but integrates into the plan page after US1 date loading.

### Parallel Opportunities

- T002, T003, and T004 can be authored independently after T001; T005 extends T004's component test file and follows it.
- T011's skip-button tests can be authored independently from T010's plan-card assertions.
- T006, T007, and T008 touch separate files and can be implemented independently after T001; T009 follows T008.
- T015's completion-history tests can be authored independently of plan-detail implementation.
- After shared contract setup, timezone, detail BFF, detail view, skip BFF/button, and completion-history work touch separate files and can be delegated independently after their tests.

## Parallel Example: User Story 1

```text
Task: T002 — tests/unit/format.test.ts
Task: T003 — tests/component/planning/plan-board.test.tsx
Task: T004 — tests/component/planning/MealEntryDetail.test.tsx
```

## Parallel Example: User Story 2

```text
Task: T010 — plan-card outcome assertions in tests/component/planning/plan-board.test.tsx
Task: T011 — tests/component/planning/SkipMealButton.test.tsx
```

After those tests, the skip BFF route (T012) and skip button (T013) are independent; action wiring (T014) follows both.

## Parallel Example: User Story 3

The component test (T015) is the required first step. `CompletedMealsList` (T016) and its plan-page integration (T017) are sequential because the page consumes the new component.

## Implementation Strategy

### MVP First

1. Pin and generate the v13 contract.
2. Complete US1 so members can inspect an API-authoritative meal detail.
3. Validate timezone, selection, loading/error, and detail behavior.

### Incremental Delivery

1. Add US2 cooked/delivery outcomes and verify idempotency/conflict behavior.
2. Add US3 completion history cards and correction/reopen permissions.
3. Finish responsive styles and the untracked rendered-review preview.

## Notes

- Every task has a checkbox, sequential ID, story label for user-story tasks, and exact file path.
- `[P]` tasks modify independent test files and do not depend on unfinished implementation.
- Do not stage `src/app/dev-preview/plan/page.tsx`.
- The `e2e/plan-detail.spec.ts` smoke test is skipped unless `RUN_PLANNING_E2E=1` and an authenticated local API stack are supplied, matching `e2e/planning.spec.ts`.
- The lead owns the rendered responsive check at 375, 768, 1024, and 1440px after push; leave its convergence checkbox open.

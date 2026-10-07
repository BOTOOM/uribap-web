---

description: "Implementation tasks for household-local dashboard date"
---

# Tasks: Household-local dashboard date

**Input**: Design documents from `specs/019-household-date/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Regression coverage is required by FR-007.

## Phase 1: Setup

**Purpose**: Confirm the existing date and server-fetch foundations used by the feature.

- [x] T001 Review existing household time-zone handling in `src/app/(app)/plan/page.tsx` and `src/lib/format.ts`
- [x] T002 Review current home date and query-window derivation in `src/app/(app)/page.tsx`

---

## Phase 2: Foundational

**Purpose**: Define one reusable dashboard date window before integrating the route.

- [x] T003 [P] Create failing Colombia/UTC boundary coverage in `tests/unit/dashboard-date-window.test.ts`
- [x] T004 Implement the pure date-window helper in `src/lib/dashboard/date-window.ts`

**Checkpoint**: Household-local today produces a consistent tomorrow and Monday-to-Sunday window.

---

## Phase 3: User Story 1 - See the correct local day on the home (Priority: P1)

**Goal**: Group meals and request weekly data according to the household-local calendar date.

**Independent Test**: At `2026-10-08T01:00:00Z`, an `America/Bogota` household uses October 7 as today and October 8 as tomorrow.

- [x] T005 [US1] Resolve the active household time zone in `src/app/(app)/page.tsx`
- [x] T006 [US1] Use the shared household-local date window for meal grouping, plan week, and forecast dates in `src/app/(app)/page.tsx`
- [x] T007 [US1] Run the focused boundary tests documented in `specs/019-household-date/quickstart.md`

**Checkpoint**: The home remains on the Colombian date after UTC midnight.

---

## Phase 4: User Story 2 - Keep the home usable if time-zone data fails (Priority: P2)

**Goal**: Preserve dashboard availability and current behavior when calendar metadata cannot be resolved.

**Independent Test**: Invalid or unavailable household time-zone data returns the UTC fallback date window without throwing.

- [x] T008 [P] [US2] Add invalid-time-zone and UTC fallback coverage in `tests/unit/dashboard-date-window.test.ts`
- [x] T009 [US2] Preserve the account error boundary and isolate household time-zone fallback in `src/app/(app)/page.tsx`

**Checkpoint**: Time-zone metadata failures do not take down available home sections.

---

## Phase 5: Polish and cross-cutting verification

- [x] T010 Review `specs/019-household-date/checklists/timezone.md` against the completed artifacts
- [x] T011 Run lint, typecheck, affected tests, production build, and `git diff --check` from `specs/019-household-date/quickstart.md`
- [x] T012 Record implementation evidence and convergence in `specs/019-household-date/tasks.md`

### Implementation evidence

- Focused and affected tests: 56 files, 278 tests passed.
- Lint, TypeScript, production build, and `git diff --check` passed.
- Convergence found no remaining work against the feature artifacts.

---

## Dependencies and execution order

- T001 and T002 establish the existing patterns.
- T003 must fail before T004 implements the helper.
- T004 blocks T005 and T006.
- T005 and T006 complete User Story 1 before fallback integration is considered complete.
- T008 can run after T004 and in parallel with T005/T006.
- T009 depends on T005.
- T010 through T012 depend on all implementation tasks.

## Parallel opportunities

- T001 and T002 can be reviewed in parallel.
- T003 can be written while route integration details are reviewed.
- T008 can be added independently after the date-window helper interface exists.

## Implementation strategy

1. Deliver the pure date window and boundary regression test.
2. Integrate the home without changing presentation or client behavior.
3. Add fallback evidence.
4. Run the full quickstart and converge all artifacts.

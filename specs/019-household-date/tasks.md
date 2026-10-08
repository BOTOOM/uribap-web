---

description: "Implementation tasks for browser-local dashboard date"
---

# Tasks: Browser-local dashboard date

**Input**: Design documents from `specs/019-household-date/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Regression coverage is required by FR-008.

## Phase 1: Setup

**Purpose**: Confirm the existing date and server-fetch foundations used by the feature.

- [x] T001 Review existing household time-zone handling in `src/app/(app)/plan/page.tsx` and `src/lib/format.ts`
- [x] T002 Review current home date and query-window derivation in `src/app/(app)/page.tsx`

---

## Phase 2: Foundational

**Purpose**: Define one reusable dashboard date window before integrating the route.

- [x] T003 [P] Create failing Colombia/UTC boundary coverage in `tests/unit/dashboard-date-window.test.ts`
- [x] T004 Implement the pure date-window helper in `src/lib/dashboard/date-window.ts`

**Checkpoint**: One selected local date produces a consistent tomorrow and Monday-to-Sunday window.

---

## Phase 3: Initial household-time-zone implementation (superseded by T013+)

**Goal**: Record the first implementation, whose household-first date authority is superseded by the browser-first requirements below.

**Independent Test**: The original implementation used `America/Bogota` as today at `2026-10-08T01:00:00Z`; the current expected behavior is covered by T013+.

- [x] T005 [US1] Resolve the active household time zone in `src/app/(app)/page.tsx`
- [x] T006 [US1] Use the shared household-local date window for meal grouping, plan week, and forecast dates in `src/app/(app)/page.tsx`
- [x] T007 [US1] Run the focused boundary tests documented in `specs/019-household-date/quickstart.md`

**Checkpoint**: The original household-first implementation was verified; the current browser-first behavior is verified by T013+.

---

## Phase 4: Initial household fallback implementation (superseded by T013+)

**Goal**: Record the original UTC fallback implementation, now extended to the browser → household → UTC order below.

**Independent Test**: Invalid or unavailable time-zone data returns the UTC fallback date window without throwing.

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

## Phase 6: Browser time-zone authority update

**Purpose**: Make the viewer's browser time zone primary while preserving the household and UTC fallbacks.

- [x] T013 Add `isValidTimeZone`, `pickTimeZone`, and guarded cookie decoding in `src/lib/time-zone.ts`, with unit coverage in `tests/unit/time-zone.test.ts`.
- [x] T014 Add `BrowserTimeZoneSync` to write `uribap_tz` and refresh only when the browser zone differs; cover absent, different, and matching cookie cases.
- [x] T015 Update AppShell and the home to use the valid browser cookie first; skip the household time-zone lookup when it is valid, otherwise use household then UTC without changing `dashboardDateWindow`.
- [x] T016 Update the feature spec, plan, contract, data model, research, quickstart, and checklists for browser → household → UTC authority and first-visit synchronization.
- [x] T017 Add browser-over-household boundary coverage and run focused Vitest tests, lint, typecheck, build, and `git diff --check`.
- [x] T018 Run the full test suite, record implementation evidence, and converge the feature artifacts.

### Browser-time-zone implementation evidence

- Focused Vitest: `pnpm exec vitest run --config vitest.config.mts tests/unit/time-zone.test.ts tests/unit/dashboard-date-window.test.ts tests/unit/format.test.ts tests/component/browser-time-zone-sync.test.tsx` — 4 files, 19 tests passed.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed.
- `pnpm test` — 58 files, 293 tests passed.
- Spec Kit convergence checked all 9 functional requirements, 6 success criteria, 8 acceptance scenarios, 5 plan decision sections, and 4 constitution sections; no remaining gaps were found.
- Final `git diff --check` passed after task evidence was recorded.

---

## Dependencies and execution order

- T001 and T002 establish the existing patterns.
- T003 must fail before T004 implements the helper.
- T004 blocks T005 and T006.
- T005 and T006 complete User Story 1 before fallback integration is considered complete.
- T008 can run after T004 and in parallel with T005/T006.
- T009 depends on T005.
- T010 through T012 depend on all implementation tasks.
- T013 precedes T014 and T015; T014 and T015 consume the time-zone helpers from T013.
- T016 tracks the browser-first design alongside T013–T015.
- T017 depends on T013–T016; T018 depends on a successful T017.

## Parallel opportunities

- T001 and T002 can be reviewed in parallel.
- T003 can be written while route integration details are reviewed.
- T008 can be added independently after the date-window helper interface exists.

## Initial implementation strategy (superseded by Phase 6)

1. Deliver the pure date window and boundary regression test.
2. Integrate the home without changing presentation or client behavior.
3. Add fallback evidence.
4. Run the full quickstart and converge all artifacts.

## Current implementation strategy

1. Validate the request cookie and select browser time zone before household and UTC fallbacks.
2. Keep the home and AppShell server-rendered, isolating browser time-zone detection in one client leaf.
3. Derive the home date window from the selected zone without changing `dashboardDateWindow`.
4. Verify cookie synchronization, boundary behavior, and the documented first-visit fallback.

---

## Phase 7: Review follow-up

**Purpose**: Keep completion labels and browser-zone synchronization current, and exercise the
dashboard's real date-resolution and request-building path.

- [x] T019 Add `isoDayInTimeZone` beside `todayInTimeZone`, delegate today calculation to it, use
  the resolved dashboard zone for the latest-completion label, and cover the Bogota/Tokyo instant
  boundary.
- [x] T020 Re-run browser-zone synchronization on pathname changes and visible focus/visibility
  events; verify cookie writes and refresh counts in the component test.
- [x] T021 Cover `loadDashboard` with a Tokyo cookie, a Bogota household fallback, and a failed
  household lookup; assert the exact plan and forecast request paths.
- [x] T022 Run the focused Vitest files, lint, typecheck, and `git diff --check`; record results in
  `converge.md`.

### Review follow-up verification evidence

- Focused Vitest: `pnpm exec vitest run --config vitest.config.mts tests/unit/format.test.ts tests/unit/dashboard-date-window.test.ts tests/unit/dashboard-data-path.test.ts tests/component/browser-time-zone-sync.test.tsx` — **PASS**, 4 files and 11 tests.
- `pnpm lint` — **PASS**.
- `pnpm typecheck` — **PASS**.

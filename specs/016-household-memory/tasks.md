---
description: "Implementation tasks for household memory settings"
---

# Tasks: Household Memory Settings

**Input**: Design documents from `/specs/016-household-memory/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, and `contracts/`

**Tests**: Tests are required by the feature brief and must be written before their corresponding product implementation.

**Organization**: Tasks are grouped by user story. Test tasks precede the implementation tasks they cover.

## Phase 1: Setup

**Purpose**: Pin the authoritative API 018 contract and generated schema.

- [x] T001 Update API contract assertions for the API 018 revision and schema v14 in `tests/unit/api-contract.test.ts`.
- [x] T002 Copy API branch `devin/1790821649-household-memory` OpenAPI to `contracts/uribap-api.openapi.json`, run `pnpm api:generate`, and update `contracts/metadata.json` without hand-editing generated files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Specify all BFF forwarding behavior before adding handlers.

- [x] T003 [P] Add BFF route tests in `tests/unit/memory-routes.test.ts` for profile GET; diner/memory POST idempotency header and body forwarding; PATCH body forwarding; preserved 201/200/problem statuses and problem detail; and empty 204 DELETE responses.

**Checkpoint**: Contract and failing route tests define the Web/API boundary before user-story implementation.

---

## Phase 3: User Story 1 - Review household and diner memories (Priority: P1) 🎯 MVP

**Goal**: Render the server-loaded household profile with correct ownership, grouping, labels, and restriction emphasis.

**Independent Test**: Render household and multiple diner profiles and verify each memory appears once, diner kind order and labels are correct, a linked diner is marked, and empty state content remains available.

### Tests for User Story 1

> Write the tests first and observe failure before adding grouping or page UI.

- [x] T004 [P] [US1] Add pure grouping/order and eligible-member filtering tests in `tests/unit/memory/grouping.test.ts` for all five kinds, missing kinds, stable content grouping, active-member status, and duplicate diner links.
- [x] T005 [P] [US1] Add profile component and accessibility tests in `tests/component/memory/MemoryProfile.test.tsx` and `tests/accessibility/memory.a11y.test.tsx` for the page heading and intro, household/diner ownership, labels, restriction text, linked chip, empty state, semantic labeling, and visible focus.

### Implementation for User Story 1

- [x] T006 [US1] Implement memory-kind labels/order and grouping helpers in `src/components/memory/memory-utils.ts`.
- [x] T007 [US1] Implement the profile cards and empty-state composition in `src/components/memory/MemoryProfile.tsx`.
- [x] T008 [US1] Add `GET /api/memory/profile` forwarding in `src/app/api/memory/profile/route.ts`.
- [x] T009 [US1] Add the Server Component at `src/app/(app)/settings/memoria/page.tsx` to load the profile and active members server-side, filtering already-linked members.
- [x] T010 [US1] Add the “Memoria” item to `src/components/shell/ShellNav.tsx` and `src/components/shell/MobileNav.tsx`.

**Checkpoint**: The read-only profile is independently usable and tested before mutations are added.

---

## Phase 4: User Story 2 - Add, edit, and forget memories (Priority: P1)

**Goal**: Let members add, edit, and forget household or diner memories with idempotent creates and optimistic updates.

**Independent Test**: Submit a memory and inspect `Idempotency-Key`, edit it and inspect `expected_version`, then exercise forget confirmation and 409/404/422/403 feedback.

### Tests for User Story 2

> Write the tests first and observe failure before adding memory mutation controls.

- [x] T011 [P] [US2] Add memory card/form tests in `tests/component/memory/MemoryCard.test.tsx` for add idempotency, 1–1000 character counter, edit kind/content with `expected_version`, forget confirmation, keyboard operation, announced success/error states, 409 refresh/conflict, 404 gone state, 422 field errors, permission errors, and pending state.

### Implementation for User Story 2

- [x] T012 [US2] Implement the household/diner memory add and inline edit/forget client leaves in `src/components/memory/MemoryCard.tsx`.
- [x] T013 [US2] Add POST `/api/memories` forwarding in `src/app/api/memories/route.ts`, including body and `Idempotency-Key`.
- [x] T014 [US2] Add PATCH/DELETE `/api/memories/{memoryId}` forwarding in `src/app/api/memories/[memoryId]/route.ts`, preserving statuses, problem detail, and 204.

**Checkpoint**: Each card supports the complete memory lifecycle and refreshes server-authoritative state after mutation or stale responses.

---

## Phase 5: User Story 3 - Manage diner profiles (Priority: P2)

**Goal**: Let members add, link, rename, and archive diner profiles without duplicate member links.

**Independent Test**: Add a linked and unlinked diner, verify only eligible active members can be selected, rename with the current version, and test archive cancellation/confirmation copy.

### Tests for User Story 3

> Write the tests first and observe failure before adding diner controls.

- [x] T015 [P] [US3] Add diner form/action tests in `tests/component/memory/DinerCard.test.tsx` for required 1–80 character name, eligible-member filtering, POST idempotency, rename `expected_version`, archive confirmation/copy, keyboard operation, announced status, 409/404/422/403 states, and refresh.

### Implementation for User Story 3

- [x] T016 [US3] Implement add-person controls in `src/components/memory/AddDinerForm.tsx` and rename/confirmed-archive controls in `src/components/memory/DinerCard.tsx`.
- [x] T017 [US3] Add POST `/api/diners` forwarding in `src/app/api/diners/route.ts`, including body and `Idempotency-Key`.
- [x] T018 [US3] Add PATCH/DELETE `/api/diners/{dinerId}` forwarding in `src/app/api/diners/[dinerId]/route.ts`, preserving statuses, problem detail, and 204.

**Checkpoint**: Diner creation, linking, rename, and archive are independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish responsive presentation, opt-in E2E coverage, preview, and release verification.

- [x] T019 [P] Add authenticated browser coverage in `e2e/memory.spec.ts`, skipped unless `RUN_MEMORY_E2E=1` and an authenticated local stack are available, for the memory add/forget journey and no horizontal overflow at 375px, 768px, 1024px, and 1440px.
- [x] T020 Add responsive and reduced-motion styles in `src/app/globals.css` for memory cards, forms, restriction treatment, counters, and confirmations; preserve visible focus and provide practical 44px touch targets.
- [x] T021 Add the fixture-only preview in `src/app/dev-preview/memory/page.tsx`, visually check 375px, 768px, 1024px, and 1440px, and capture `/home/ubuntu/work/memory-375.png` and `/home/ubuntu/work/memory-1440.png`; leave the entire `src/app/dev-preview/` directory uncommitted.
- [x] T022 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm api:check`, `pnpm build`, and `git diff --check`; fix feature-caused failures and audit the new memory paths for console logging.
- [x] T023 Complete `specs/016-household-memory/converge.md`, explicitly record the gated E2E status, and commit/push the feature branch without staging preview files.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pin the API contract and generated types.
- **Foundational (Phase 2)**: Depends on contract sync; route tests must precede handler implementation.
- **User Story 1 (Phase 3)**: Depends on the contract and profile route tests; delivers the read-only MVP.
- **User Story 2 (Phase 4)**: Depends on the profile card composition from User Story 1.
- **User Story 3 (Phase 5)**: Depends on the profile card composition and member choices from User Story 1.
- **Polish (Phase 6)**: Depends on all three user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Independent after contract setup; MVP is a readable server-loaded profile.
- **User Story 2 (P1)**: Uses the card shell from User Story 1.
- **User Story 3 (P2)**: Uses the server-loaded profile and eligible member choices from User Story 1.

### Parallel Opportunities

- Contract metadata assertion (T001) and route test authoring (T003) touch different files; execute in their prerequisite order around snapshot generation.
- Within User Story 1, grouping tests (T004) and profile/accessibility tests (T005) are independent files.
- User Story 2 and User Story 3 tests can be developed in separate files after the profile contract is stable.
- The gated E2E spec (T019) and stylesheet work (T020) are independent after the page structure exists.

## Parallel Example: User Story 1

```text
Task: T004 grouping/order tests in tests/unit/memory/grouping.test.ts
Task: T005 profile/accessibility tests in tests/component/memory/MemoryProfile.test.tsx
```

## Implementation Strategy

1. Sync the authoritative contract and generated types.
2. Add BFF forwarding tests before route handlers.
3. Deliver the read-only profile as the MVP and validate it independently.
4. Add memory mutations, then diner management, with test-first coverage for each.
5. Finish navigation, responsive styles, gated E2E, preview screenshots, all requested verification, convergence, and push.

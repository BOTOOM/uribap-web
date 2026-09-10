---
description: "Executable tasks for the Uribap Web foundation"
---

# Tasks: Web Foundation and Design System

**Input**: Design documents from `specs/001-web-foundation-design-system/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Model policy**: primary Luna, implementation Sol, review Terra, artifact analysis GLM-5.3,
routine fixes SWE-2; Kimi K3 only with explicit large-artifact escalation.

## Phase 1: Setup

**Purpose**: Create the Next.js project, dependency lockfile, and testing/tooling baseline.

- [X] T001 Initialize the Next.js App Router project with TypeScript, Tailwind CSS, ESLint, `src/`, and the configured import alias using `pnpm create next-app` in the repository root.
- [X] T002 [P] Add and pin foundation dependencies for Radix/shadcn primitives, Phosphor icons, Motion, TanStack Query, Zod, React Hook Form, `openapi-typescript`, and `openapi-fetch` in `package.json`.
- [X] T003 [P] Configure Vitest/Testing Library, Playwright, axe integration, TypeScript, ESLint, and package scripts in `package.json` and test config files.
- [X] T004 [P] Create `.env.example`, `next.config.ts`, `Dockerfile`, `compose.yml`, and `.dockerignore` with no secrets.

## Phase 2: Foundational

**Purpose**: Blocking shell, tokens, API seam, state contract, and accessibility infrastructure.

**Checkpoint**: No user-story work starts until foundation lint, type, unit, accessibility, build,
contract, and container checks pass.

- [X] T005 Create semantic design tokens and global reset in `src/styles/tokens.css` and `src/app/globals.css` from the approved Open Design reference.
- [X] T006 [P] Create App Router root metadata, root layout, error, loading, and not-found boundaries in `src/app/layout.tsx`, `src/app/error.tsx`, `src/app/loading.tsx`, and `src/app/not-found.tsx`.
- [X] T007 [P] Create typed environment/config validation in `src/lib/config/env.ts` without exposing server secrets to client components.
- [X] T008 [P] Create API contract snapshot metadata and generation/check scripts in `contracts/uribap-api.openapi.json`, `src/lib/api/generated/`, and `package.json`.
- [X] T009 Create reusable state components for loading, empty, error, unauthorized, forbidden, stale/conflict, and unavailable states in `src/components/states/`.
- [X] T010 Create accessible UI primitives/wrappers for buttons, links, dialogs, menus, tabs, fields, live regions, and status badges in `src/components/ui/`.
- [X] T011 Create shell layout/navigation primitives in `src/components/shell/` and route groups `src/app/(public)/` and `src/app/(app)/` without domain calculations.

## Phase 3: User Story 1 - Open a Coherent Uribap Shell (Priority: P1)

**Goal**: A reviewer can open a responsive, deep-link-safe Uribap shell with meaningful empty/loading states.

**Independent Test**: Playwright opens the shell at required widths, checks navigation/focus/no
horizontal overflow, and verifies a useful empty state without backend data.

### Tests for User Story 1

- [X] T012 [P] [US1] Add responsive shell E2E coverage at 375, 768, 1024, and 1440px in `e2e/foundation.spec.ts`.
- [X] T013 [P] [US1] Add keyboard/focus and no-horizontal-overflow assertions in `tests/accessibility/shell.a11y.test.tsx`.
- [X] T014 [US1] Add shell loading/empty/error state component tests in `tests/component/states.test.tsx`.

### Implementation for User Story 1

- [X] T015 [US1] Implement the Uribap brand shell, desktop sidebar, mobile bottom navigation, content frame, skip link, and deep-link-safe route layout in `src/components/shell/` and `src/app/(app)/layout.tsx` to satisfy T012-T013.
- [X] T016 [US1] Implement the foundation home/empty view with Spanish-neutral copy, loading skeleton, and recovery action in `src/app/page.tsx` and `src/features/foundation/` to satisfy T014.
- [X] T017 [US1] Implement responsive tokens/layout constraints and safe long-content wrapping in `src/styles/tokens.css` and `src/app/globals.css` to satisfy T012.

**Checkpoint**: US1 is independently demonstrable without authentication or domain data.

## Phase 4: User Story 2 - Use One Consistent Uribap Visual Language (Priority: P1)

**Goal**: Contributors can compose future surfaces from tokens and accessible primitives with deliberate motion.

**Independent Test**: A foundation specimen and component tests expose token roles, primitive
states, reduced motion, icon treatment, and focus behavior.

### Tests for User Story 2

- [X] T018 [P] [US2] Add token and primitive state coverage in `tests/component/design-system.test.tsx`.
- [X] T019 [P] [US2] Add reduced-motion and motion-property checks in `tests/accessibility/motion.a11y.test.tsx`.
- [X] T020 [US2] Add representative axe checks for dialogs, menus, tabs, fields, and live regions in `tests/accessibility/primitives.a11y.test.tsx` and `e2e/a11y.spec.ts`.

### Implementation for User Story 2

- [X] T021 [US2] Implement semantic token roles for surfaces, text, borders, focus, brand, and domain status colors in `src/styles/tokens.css` to satisfy T018.
- [X] T022 [US2] Implement accessible primitive variants and state styling using existing Radix/shadcn ownership in `src/components/ui/` to satisfy T018 and T020.
- [X] T023 [US2] Implement restrained, interruptible Motion/CSS transitions with reduced-motion fallback in `src/components/ui/` and `src/features/foundation/` to satisfy T019.
- [X] T024 [US2] Create the foundation design-system specimen/documentation surface in `src/features/foundation/DesignSystemSpecimen.tsx` for review of tokens, states, typography, and motion.

**Checkpoint**: US2 is independently reviewable as the reusable Uribap visual system.

## Phase 5: User Story 3 - Consume the Backend Boundary Safely (Priority: P1)

**Goal**: Web generates a typed client from a pinned API contract and renders safe request states.

**Independent Test**: Regenerate the client twice, run type/contract checks, and exercise loading,
error, unauthorized, unavailable, and success state examples.

### Tests for User Story 3

- [X] T025 [P] [US3] Add OpenAPI snapshot freshness and generated-client determinism tests in `tests/unit/api-contract.test.ts`.
- [X] T026 [P] [US3] Add typed request-state component tests in `tests/component/states.test.tsx`.
- [X] T027 [US3] Add API-unavailable/error E2E scenarios in `e2e/api-state.spec.ts`; authorization/unauthorized behavior is deferred to `002-identity-households`.

### Implementation for User Story 3

- [X] T028 [US3] Add the pinned foundation OpenAPI snapshot and source revision metadata in `contracts/uribap-api.openapi.json` and `contracts/metadata.json` to satisfy T025.
- [X] T029 [US3] Generate and expose the typed client in `src/lib/api/generated/` with `src/lib/api/client.ts`; fail on stale output to satisfy T025.
- [X] T030 [US3] Implement server/client API boundary helpers and safe request-state mapping in `src/lib/api/` and `src/components/states/` to satisfy T026-T027.
- [X] T031 [US3] Add a contract compatibility check against the public `uribap-api` revision in `.github/workflows/contract.yml` and `package.json`.

**Checkpoint**: US3 is independently demonstrable with a pinned contract and no domain calculations.

## Phase 6: Polish and Cross-Cutting Concerns

- [X] T032 [P] Run lint, TypeScript, unit/component, axe, Playwright, production build, API generation, and container checks; record results in `specs/001-web-foundation-design-system/quickstart.md`.
- [X] T033 [P] Add dependency/license/secret scan and performance budget checks to `.github/workflows/ci.yml`; the license exception and 2MB chunk budget are documented and passing.
- [X] T034 Review bundle size, Server/Client Component boundaries, and Web Vitals in `src/app/`, `src/components/`, and `src/lib/` using the Vercel/Next guidance and record the result in `docs/performance/foundation.md`.
- [X] T035 Complete a read-only Spec Kit consistency analysis for `specs/001-web-foundation-design-system/` and record any artifact drift. The GLM CLI invocation was blocked because sandbox prerequisites are unavailable; a manual equivalent verified FR/SC/task coverage, constitution alignment, and no critical drift.

## Dependencies and Execution Order

- Phase 1 precedes Phase 2; Phase 2 blocks all user stories.
- US1, US2, and US3 depend on Phase 2 and may proceed in parallel only when files do not overlap.
- Tests precede implementation tasks in each story.
- T032-T035 are release gates after all desired stories.

## Parallel Opportunities

- T002-T004 can run in parallel after T001.
- T006-T010 can run in parallel where files do not overlap.
- T012-T014, T018-T020, and T025-T027 can each run in parallel before their story implementation.
- T033 and T034 can run in parallel after core validation.

## Implementation Strategy

1. Complete Phase 1 and Phase 2.
2. Complete US1 and validate the shell at all target widths.
3. Complete US2 and review the design-system specimen.
4. Complete US3 and validate the pinned API boundary.
5. Run the cross-cutting gate before adding authentication or domain screens.

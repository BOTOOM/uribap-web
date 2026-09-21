# Tasks: Recipes and Ingredients Web

**Model policy**: Luna architecture, Sol implementation, Terra review, GLM analysis, SWE-2 bounded fixes.

## Phase 1: Spec and contract

- [ ] T001 [P] Complete `analyze.md` and validate FR/SC traceability in `specs/003-recipes-ingredients/analyze.md`.
- [ ] T002 [P] Sync API 003 OpenAPI snapshot and generated client in `contracts/uribap-api.openapi.json` and `src/lib/api/generated/schema.ts` after API T015.
- [ ] T003 Add typed server BFF helpers for ingredients/recipes in `src/lib/api/server-client.ts`.

## Phase 2: Ingredients experience

- [ ] T004 [P] Add ingredient list/search/filter component tests in `tests/component/ingredients/ingredient-list.test.tsx`.
- [ ] T005 Implement ingredients page, loading/empty/error/forbidden states, and search controls in `src/app/(app)/ingredientes/page.tsx` and `src/components/ingredients/`.

## Phase 3: Recipes experience

- [ ] T006 [P] Add recipe list/detail/form component tests in `tests/component/recipes/`.
- [ ] T007 Implement recipe list/detail/version UI in `src/app/(app)/recetas/page.tsx`, `src/app/(app)/recetas/[recipeId]/page.tsx`, and `src/components/recipes/`.
- [ ] T008 Implement draft/publish form and favorite interaction through server-only BFF routes in `src/app/(app)/recetas/nueva/page.tsx`, `src/features/recipes/`, and `src/app/api/recipes/`.
- [ ] T009 Add owner/admin/member, stale/conflict, archived, and API unavailable state coverage in `tests/component/recipes/` and `e2e/recipes.spec.ts`.

## Phase 4: Verification and convergence

- [ ] T010 Add responsive/a11y Playwright coverage at 375/768/1024/1440 in `e2e/recipes.spec.ts` and `tests/accessibility/recipes.spec.ts`.
- [ ] T011 Run Web lint/typecheck/Vitest/Playwright/axe/audit/license/performance/build/Docker gates and record `specs/003-recipes-ingredients/quickstart.md`.
- [ ] T012 Write `specs/003-recipes-ingredients/converge.md`, resolve remaining tasks, and mark the feature complete only after all checks pass.

## Dependencies

T001–T003 → T004–T005 and T006–T009 → T010–T012.

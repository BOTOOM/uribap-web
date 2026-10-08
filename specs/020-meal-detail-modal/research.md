# Research: Meal Detail Modal

## Clarification Outcome

The user supplied a settled interaction and implementation design. No product or API behavior remains unresolved. The following details are recorded explicitly for the plan and implementation:

1. **One shared modal**: both the plan board and home list use `MealDetailDialog`; the dialog wraps `MealEntryDetail` rather than duplicating detail fetching or actions.
2. **Explicit selection**: selection starts at `null`, is set only by activating a meal card/row, and is derived against the latest entries so a deleted entry has no dialog target.
3. **No-plan home state**: `HomeMealList` receives nullable plan context. Missing plan metadata or an empty row list renders the supplied empty label and no dialog.
4. **Completion authority**: the server projects only `state === "recorded"` completions into home rows; `cooked` and `skipped` remain API-owned outcomes.
5. **Detail refresh**: the selected target's ID, outcome, and completion version form the existing detail component's refresh key. No new cache or fetch behavior is introduced.
6. **Test accessibility engine**: `tests/accessibility/planning.a11y.test.tsx` is a Vitest/jsdom component test, while the existing Playwright axe scan is in `e2e/a11y.spec.ts`. The feature will use `axe-core` in jsdom for the requested open-dialog axe assertion. `axe-core@4.13.0` is already present transitively through `@axe-core/playwright`; if Vitest cannot resolve it directly, expose that same version as a direct development dependency rather than introducing a second axe version.
7. **Preview access**: the requested `/dev-preview/meal-modal` route is outside `src/proxy.ts`'s auth matcher. The root layout does not authenticate requests, so the fixture can be served without a session.
8. **Focus restoration**: the controlled Radix dialog has no trigger element to restore focus to. `MealDetailDialog` must remember the latest entry ID, focus its surviving card/row on close, and use a callback supplied by its owner if refreshed data removed that trigger.

## Repository Findings

- `src/components/planning/MealEntryDetail.tsx` owns the existing GET to `/api/plans/${planId}/entries/${entryId}/detail`, loading/error/retry behavior, and detail action composition. Its current `refreshKey` prop already participates in its request key.
- `src/components/ui/Dialog.tsx` wraps the existing Radix dialog primitives; PlanBoard's add-meal dialog already establishes the repository's close-button pattern and title semantics.
- `src/components/planning/PlanBoard.tsx` currently selects a meal on mount and on day-picker activation, then renders `MealEntryDetail` inline beneath the week grid. Those selection and inline-render behaviors are the plan-board changes in scope.
- `src/app/(app)/page.tsx` is a Server Component with a server-rendered `MealRows` helper. It already loads the plan entries and completions needed to project interactive home rows; the surrounding dashboard and date-loading logic are out of scope.
- `src/app/(app)/plan/page.tsx` filters completion rows to `state === "recorded"` before mapping outcomes to entries; home will follow that source-of-truth pattern.
- `src/app/globals.css` defines the dialog positioning/animation, entry-detail card styles, meal-row grid, mobile breakpoint at 820px, and global focus-visible/reduced-motion rules. The feature can extend these without changing global design tokens.
- `tests/component/planning/plan-board.test.tsx` already covers board rendering and the add-meal flow. `tests/accessibility/planning.a11y.test.tsx` uses Testing Library semantics; `e2e/a11y.spec.ts` contains the repository's Playwright `AxeBuilder` example.
- `e2e/plan-detail.spec.ts` is gated by the existing planning E2E environment check and already exercises the plan-detail route at mobile and desktop widths.
- The required Next.js client-boundary guidance was read at `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` and `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`. Interactive state remains isolated in client leaves; server pages pass serializable props.

## Alternatives Considered

- **Keep detail inline and add scroll controls**: rejected because the reported problem is the long scroll between a meal card and its detail on mobile and desktop.
- **Create a second home-specific detail fetch/view**: rejected because it duplicates the existing authoritative request, error handling, and actions.
- **Navigate home rows to `/plan`**: rejected because the requirement is to inspect the meal without leaving home.
- **Open the first or active day's meal by default**: rejected because details must be fetched only after explicit user intent.
- **Make plan metadata mandatory for an empty home section**: rejected because a missing plan has no valid plan ID/state/version and must not create an openable target.

## Research Resolution

The existing client/server boundaries, detail component, dialog primitive, completion projection, and responsive styles support the requested implementation without an API change. The design is feasible with the stated scope. The only implementation detail not present as a direct dependency is `axe-core` for the Vitest/jsdom assertion; its already-locked version will be reused directly if module resolution requires it.

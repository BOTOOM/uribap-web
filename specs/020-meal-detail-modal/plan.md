# Implementation Plan: Meal Detail Modal

**Branch**: `devin/1791403355-meal-detail-modal` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-meal-detail-modal/spec.md`

## Summary

Replace PlanBoard's inline meal detail with an explicit-open Radix modal and make home meal rows open the same existing detail view. Keep server data loading and recorded completion mapping in the home page, isolate selection in client leaves, and use responsive dialog/bottom-sheet CSS. The API contract, detail fetching/actions, home date logic, and other dashboard content remain unchanged.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16.3.6  
**Primary Dependencies**: Next.js App Router, Radix Dialog wrapper, existing `MealEntryDetail`, Phosphor icons  
**Storage**: N/A; selection is ephemeral client UI state  
**Testing**: Vitest/jsdom, Testing Library, axe-core 4.13.0, Playwright E2E  
**Target Platform**: Responsive web, supported desktop and mobile browsers  
**Project Type**: Next.js web application  
**Performance Goals**: Do not request detail until a meal is explicitly opened; reuse the existing detail request and avoid duplicate client data logic  
**Constraints**: Existing 820px breakpoint, desktop modal max width 920px, mobile bottom sheet with safe-area padding, no API or home date/loading changes  
**Scale/Scope**: One shared dialog, one plan-board selection flow, two home meal sections, focused component/accessibility/E2E coverage

## Constraints

- Reuse `MealEntryDetail` and `@/components/ui/Dialog`; do not change detail fetch, actions, retry behavior, or `MealEntryDetailView`.
- Keep the home route a Server Component; project serializable row props and recorded completion outcomes on the server.
- The client components own only selected-entry state; current entry props remain authoritative after refresh.
- Use only completions whose API state is `recorded`; do not infer outcome from plan state.
- Do not change contracts, date resolution, `loadDashboard`, or content outside the meal rows.
- Preserve Radix keyboard/focus behavior, semantic button interaction, visible focus, reduced-motion behavior, and the existing design tokens.
- Keep `src/app/dev-preview/meal-modal/page.tsx` untracked and out of both commits.
- Do not stage or commit `next-env.d.ts`.

## Model Guidance

The `AGENTS.md` model matrix recommends `gpt-5-6-luna-high` for UI architecture, `gpt-5-6-sol-high` for implementation, `gpt-5-6-terra-high` for accessibility review, `glm-5-3-max` for long-context analysis, and `swe-2-high` for bounded fixes. These are repository guidance, not claims that separate model calls were made.

## Architecture

### Shared detail dialog

Add `src/components/planning/MealDetailDialog.tsx` as a client leaf. It receives plan context, a nullable `MealDetailTarget`, and an `onClose` callback. `target !== null` controls the existing Radix `Dialog`; the content has the accessible title and close button. Render the existing `MealEntryDetail` inside `.dialog-body` only for an active target, with refresh key `${id}:${outcome ?? "pending"}:${completionVersion ?? "none"}`.

### Plan board

In `src/components/planning/PlanBoard.tsx`, initialize `selectedId` to `null`; derive the target from the latest entries; set the active day and selected ID only from a meal-card activation. Day-picker actions update only the active day. Remove inline detail and `.no-meal-selected`; selection styling reflects an open detail target only. When a refresh removes the target entry, the derived target becomes `null` and the dialog closes.

### Home rows

Add `src/components/dashboard/HomeMealList.tsx`. The server page builds `recordedByEntry` only from recorded completions and projects row labels, recipe names, servings, outcomes, and completion versions. Nullable plan context represents the no-plan case; no target/dialog is mounted without valid plan metadata and a selected row. Preserve both existing empty labels and the “Ver detalle” link.

### Styling and accessibility

Extend `src/app/globals.css` for the 920px modal width, body padding, card-chrome removal on `.entry-detail`, button-reset/focus/hover behavior for `.meal-row-button`, and the mobile bottom-sheet geometry/animation. Reuse the global reduced-motion rule. Keep the dialog scrollable so footer actions are reachable.

### Test design

- Update `tests/component/planning/plan-board.test.tsx` for no initial fetch/dialog, click-to-open, Escape/button close, day-picker behavior, deletion after refresh, and existing create flow.
- Add `tests/component/dashboard/home-meal-list.test.tsx` for row labels/details/outcomes, endpoint fetch on activation, and empty/no-plan states.
- Add an axe-core/jsdom assertion for the open dialog to `tests/accessibility/planning.a11y.test.tsx`. Because axe-core is currently only a transitive dependency of Playwright and not root-resolvable under pnpm, add the already-locked version `axe-core@4.13.0` as a direct development dependency and update the lockfile with pnpm.
- Update the existing gated `e2e/plan-detail.spec.ts` to assert the opened dialog and horizontal overflow at its existing viewport checks; preserve its gate.
- Add the requested static preview under `src/app/dev-preview/meal-modal/page.tsx`; mock only the local detail fetch in that untracked fixture.

## Constitution Check

- **API authority**: Pass. Meal detail and recorded completion outcomes remain sourced from existing API data.
- **Server/client boundary**: Pass. Server pages load/project rows; client leaves own modal selection.
- **Accessibility**: Pass by design. Accessible dialog title, close affordance, semantic buttons, keyboard dismissal, focus-visible styling, axe coverage, and reduced-motion override are included.
- **Responsive behavior**: Pass by design. Desktop width is capped at 920px; mobile uses the existing 820px breakpoint and a safe-area-aware bottom sheet with scrollable content.
- **Contract integrity**: Pass. No OpenAPI or BFF changes.
- **Security**: Pass. The preview fixture uses only static fake data; no credentials or external services.

**Post-design re-check**: The data model contains UI selection only; no server/API entity changes or new persistence are needed. Component props are serializable except the close callback, which remains inside client composition.

## Project Structure

### Documentation

```text
specs/020-meal-detail-modal/
├── analyze.md
├── checklists/requirements.md
├── contracts/meal-detail-components.md
├── converge.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md
```

### Source and Tests

```text
src/components/planning/MealDetailDialog.tsx
src/components/planning/PlanBoard.tsx
src/components/dashboard/HomeMealList.tsx
src/app/(app)/page.tsx
src/app/globals.css
tests/component/planning/plan-board.test.tsx
tests/component/dashboard/home-meal-list.test.tsx
tests/accessibility/planning.a11y.test.tsx
e2e/plan-detail.spec.ts
src/app/dev-preview/meal-modal/page.tsx  # local-only, untracked
```

## Verification

Run in this order after the last implementation edit:

```bash
pnpm exec vitest run --config vitest.config.mts \
  tests/component/planning/plan-board.test.tsx \
  tests/component/dashboard/home-meal-list.test.tsx \
  tests/accessibility/planning.a11y.test.tsx
pnpm lint
pnpm typecheck
pnpm build
pnpm test:a11y
git diff --check
pnpm test
```

The full `pnpm test` run is last and runs once. The gated plan-detail E2E change is included in source but remains under its existing `RUN_PLANNING_E2E=1` gate. Start `pnpm dev -- --port 3100`, verify `/dev-preview/meal-modal` is reachable without auth, and leave the server running. The user owns PR creation and any post-push CI loop.

## Analyze Resolution

The initial analysis found no design/API contradiction. Home props make plan context nullable to satisfy the no-plan behavior without fabricating a plan ID. The axe assertion will reuse the already-installed axe-core version as a direct test dependency because Vitest tests run in jsdom while `AxeBuilder` requires a Playwright page. These decisions close the two concrete implementation ambiguities before code begins.

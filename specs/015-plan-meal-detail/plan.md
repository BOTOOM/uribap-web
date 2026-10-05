# Implementation Plan: Plan Meal Detail, Delivery Skip, and Completion History

**Branch**: `devin/1790820038-plan-meal-detail` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the plan's four-cell impact panel with a selected-entry detail experience backed by the API's plan-entry detail endpoint. Render the API-provided recipe, ingredient availability, and preparation data; distinguish cooked and skipped outcomes; allow an approved pending meal to be recorded as cooked or skipped; and replace the inline completion history with responsive completion cards. Dates on the plan use the active household's timezone. The Web layer formats data but does not calculate inventory or demand.

## Constraints

- Next.js 16 App Router, React, TypeScript, pnpm, generated OpenAPI schema, and the existing BFF session boundary.
- FastAPI remains authoritative for recipe details, scaled ingredient amounts, shortfalls, meal outcomes, and inventory effects.
- Format API decimal strings with `formatQuantity`; do not reproduce scaling, availability, or inventory calculations in React.
- Preserve existing Uribap tokens, classes, Spanish copy, accessibility patterns, and responsive breakpoint at 820px.
- Keep server data loading in Server Components and isolate fetch state and mutations to Client Components.
- A skipped meal is an API completion outcome that does not change inventory; do not treat it as a cooked completion.
- Do not run Docker, E2E, or authenticated-browser flows. The local preview is intentionally uncommitted.

## Model Assignment

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for accessibility, responsive states, API authority, and client/server boundaries.
- Long-context analysis: `glm-5-3-max`.
- Bounded fixes: `swe-2-high`.
- Escalation condition: stop if the API contract, household timezone source, inventory authority, accessible state handling, or mobile behavior contradicts this design.
- Model IDs follow the Web `AGENTS.md` matrix; `devin models list` is unavailable in this environment. This is an accepted, documented exception authorized by the lead, matching `specs/014-zitadel-invitations/plan.md`; these IDs are not claimed as verified in this environment.

## API Contract Sequence

Use the API branch `devin/1790817968-exclude-completed-forecast` after its dependency-fix push. Copy the API snapshot into `contracts/uribap-api.openapi.json`, run `pnpm api:generate`, set `contracts/metadata.json` to API revision `03dcb972b7fdc5a3d341894a80a4eabcebf32605`, schema version `v13`, and generated date `2026-10-05`, then update `tests/unit/api-contract.test.ts`.

The generated contract must expose:

- `GET /plans/{plan_id}/entries/{entry_id}/detail` with recipe, ingredient availability, plan state, and completion detail.
- `POST /plans/{plan_id}/entries/{entry_id}/skip` with optional reason, idempotency key, and `MealCompletionResponse`.
- `MealCompletionResponse.outcome` (`cooked` or `skipped`) and `outcome_note`.

## Architecture

### Household-local plan date

In `src/app/(app)/plan/page.tsx`, fetch `/me`, resolve the active household membership, and fetch its household timezone as the settings page does. Add `todayInTimeZone(timeZone: string)` to `src/lib/format.ts`; use `Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })`, with the existing UTC `toIsoDay` fallback when the household cannot be loaded or its zone is invalid. Derive `today`, the default week, and the current week from the returned ISO date. Unit-test the Bogotá boundary case with a fixed clock.

### BFF routes

- `src/app/api/plans/[planId]/entries/[entryId]/detail/route.ts`: GET the server-authorized entry detail via `serverHouseholdFetch`; pass API errors through as `{ detail }` with the corresponding status.
- `src/app/api/plans/[planId]/entries/[entryId]/skip/route.ts`: POST the JSON reason and `Idempotency-Key` via `serverHouseholdFetch`; return HTTP 201 and pass errors through.

Follow the current Next.js Route Handler context conventions and the existing completion route patterns.

### Plan board and meal detail

- Extend `BoardEntry` with `outcome: "cooked" | "skipped" | null`, populated from the entry's current recorded completion; `completed` remains equivalent to a non-null outcome.
- Show cooked cards as completed with a check and “Cocinada”, skipped cards as neutral “Domicilio”, and pending cards with their servings.
- Choose today's first pending entry in meal order on initial render; otherwise today's first entry; otherwise none. Day tabs select that day's first meal or clear selection when empty. Selecting a selected card does not clear it.
- On mobile, show weekday initial above day-of-month, a dot for days with meals, the accent treatment for today, and the accessible label `${formatDayLong(day)}, N comidas`; retain tab semantics and `aria-selected`.
- Replace the entire impact-panel series with `MealEntryDetail` for a selected entry and the single muted card line “Toca una comida para ver ingredientes y preparación.” when none is selected. Re-fetch when `${entry.id}:${entry.outcome ?? "pending"}` changes.
- Implement a client data-fetch wrapper with `AbortController` and loading/error/retry/success states, plus a pure `MealEntryDetailView` for rendering and tests.
- Render an `.entry-detail` card with an `aria-live="polite"` loading/content region. Its header shows the formatted planned date and meal, recipe name, servings, preparation minutes only when greater than zero, a “Pendiente” / “Cocinada” / “Domicilio” status, skipped `outcome_note`, and entry notes.
- Render ingredients and preparation in desktop columns and stack them below 820px. Ingredient rows show name, optional tag, API-provided required amount/unit, and (only before completion) either “Faltan {shortfall}” or “Hay {on_hand}”. Cooked detail says “Ya se descontó del inventario.”; skipped detail says “No se cocinó; el inventario no cambió.” Empty ingredients say “Esta receta no tiene ingredientes registrados.”
- Split the API recipe description on newlines, trim and drop empty lines, then strip a leading `^\s*(\d+[.)]|-|•)\s*`. Render an ordered list for two or more steps, a paragraph for one, and “Esta receta todavía no tiene pasos escritos.” for null/empty text.
- Keep existing remove, complete, and reopen controls; add `SkipMealButton` with a 2,000-character optional reason, JSON body containing the non-empty `reason`, `Idempotency-Key` regenerated after success, pending/error/conflict state, a reload action after HTTP 409, toast “Comida marcada como no cocinada — inventario sin cambios”, and route refresh.
- For approved pending meals, helper text is “Al marcarla como cocinada se descuentan estos ingredientes. Si pidieron domicilio, no se toca el inventario.” Proposed plans show “Aprueba el plan para marcar comidas como cocinadas.”; archived plans show no mutation action.

### Completion history

Add `src/components/completion/CompletedMealsList.tsx` with title “Comidas registradas” and a count. Sort by `planned_date` descending and meal order; render cooked, skipped, and reopened records as responsive `.completed-meal` cards, in two columns at widths of at least 1,100px and one column below. Show “Cocinada”, “Domicilio”, or muted “Reabierta” chips; show a skipped note or “Sin descontar inventario.” and a reopened reason when present. Cooked lines are in `<details>` with “Ingredientes usados ({n})”, show actual and differing planned amounts, and expose `CorrectLineForm` only for recorded cooked completions. Include the existing reopen action for recorded cooked and skipped completions. Keep history load errors visible in `role="alert"`. Remove presentation-only inline styles from the replaced history block and the expanded `CorrectLineForm`; its form layout must fit inside a consumed-line row on mobile.

### Styling and preview

Add detail, ingredient, preparation, skip-form, corrected-line, and completion-card styles near the planner rules in `src/app/globals.css`, using existing design tokens. Add mobile wrapping/stacking in the existing `max-width: 820px` rules and preserve reduced-motion behavior. Keep `CorrectLineForm` responsive without inline presentation styles. Do not retain `.impact-panel` / `.impact-cell` rules if no other page uses them.

Create `src/app/dev-preview/plan/page.tsx` with a week of weekday breakfasts and dinners, plus a two-serving caldo de pollo with four or five ingredients (one shortfall and one optional ingredient), six numbered steps, pending and cooked details, and cooked/skipped/reopened completion cards. Do not stage or commit this preview. Keep `pnpm dev` running on port 3000 after the feature push; only make an uncommitted middleware exclusion for `/dev-preview` if authentication otherwise blocks it.

## Test Plan

- Plan board: initial selection, day-picker behavior, and cooked/skipped labels.
- `MealEntryDetailView`: missing/available quantities, optional ingredients, line-marker removal and empty lines, one/multiple steps, empty-description/ingredients, and actions by plan state/outcome.
- `MealEntryDetail`: fetch loading/success and error/retry behavior.
- `SkipMealButton`: endpoint, reason payload, `Idempotency-Key`, success refresh/toast, and 409 reload.
- `CompletedMealsList`: cooked/skipped/reopened states, correctability, reopen control, and absence of inline style attributes.
- `CorrectLineForm`: expanded correction form remains within the consumed-line layout and uses CSS classes rather than inline styles.
- `todayInTimeZone`: fixed Bogotá UTC boundary case and invalid-zone fallback.
- Contract metadata test: pinned API revision, schema `v13`, and generated date.
- `tests/accessibility/planning.a11y.test.tsx`: extend the existing semantic accessibility assertions for pending-approved and cooked detail, the expanded skip form, and completion history. The existing `tests/accessibility` files use Testing Library semantic/label assertions; the repository's Playwright axe scan is in `e2e/a11y.spec.ts`.
- `e2e/plan-detail.spec.ts`: follow `e2e/planning.spec.ts`, skip unless `RUN_PLANNING_E2E=1` and a local authenticated API stack are available, select a meal on `/plan`, assert “Ingredientes” and “Preparación”, and assert no horizontal overflow at 375px and 1440px. This gated E2E is documented but is not run in the default local/CI scope.
- After push, the lead will perform the rendered responsive review of the uncommitted preview at 375, 768, 1024, and 1440px. Keep this review open in `converge.md` until the lead records it.

## Verification

Run exactly:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm api:check
pnpm build
git diff --check
```

Commit and push the new branch after verification. Do not wait for CI. Leave the local preview reachable at `http://localhost:3000/dev-preview/plan`; keep its source file uncommitted and report that visual inspection was or was not performed.

## Constitution Check

- **API authority**: Detail, outcome, quantity, shortfall, and inventory changes come from API responses.
- **Server/client boundary**: Household timezone resolves on the server; fetch and mutation state are isolated to client leaves.
- **Accessibility**: Loading and error status are announced, actions use semantic controls, and conflict recovery is explicit.
- **Responsive behavior**: Detail and cards stack at the 820px breakpoint and must not overflow at 375px. The lead will exercise 375, 768, 1024, and 1440px on the preview after push; this remains an open convergence item.
- **Contract integrity**: Generated types use the Web's pinned copy of API OpenAPI at the post-dependency API SHA.
- **Security**: Authenticated requests remain on the server-side BFF; no session credential is passed to the browser.

## Analyze Resolution

The lead resolved analysis finding C1 by requiring a gated plan-detail E2E specification, component accessibility coverage, and a rendered review on the local preview. The E2E test intentionally follows the existing authenticated-stack gate and is skipped unless `RUN_PLANNING_E2E=1`; the four-viewport rendered review is assigned to the lead after push and remains open in the convergence record.

## Quickstart

1. Copy the API branch's post-dependency `openapi/openapi.json` into `contracts/uribap-api.openapi.json`.
2. Run `pnpm api:generate`; set contract metadata to API SHA `03dcb972b7fdc5a3d341894a80a4eabcebf32605`, `v13`, and `2026-10-05`; update its unit test.
3. Add the specified tests before implementing the plan detail and completion components.
4. Run the five pnpm verification commands in this plan and `git diff --check`.
5. Keep `src/app/dev-preview/plan/page.tsx` uncommitted, run `pnpm dev`, and verify the preview route is reachable.

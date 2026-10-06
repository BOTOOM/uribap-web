# Implementation Plan: Pantry Staple Ingredients

**Branch**: `devin/1791246997-pantry-staples` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

## Summary

Pin the pantry-staple API contract, let households mark ingredients through create and edit forms, show a small catalog badge, and explain the API-projected staple state in plan detail and forecast. All inventory and shortfall decisions remain owned by FastAPI.

## Constraints

- Next.js 16 App Router, React, TypeScript, pnpm, generated OpenAPI client, and the existing server-side BFF boundary.
- API revision `e0e347a68ed7c9a3e386645e7058636897b8d567` is pinned as schema version `v15`.
- Use the API's `pantry_staple` and `shortfall_amount` fields only; do not derive inventory or shopping behavior in React.
- Preserve existing Spanish non-staple labels, component patterns, loading/error states, keyboard operation, and mobile layout; clarify any copy that incorrectly implies staples are deducted.
- Global ingredient rows remain read-only; only household-owned ingredients get an edit action.
- Do not change dependencies, authentication, or API behavior.

## Model Assignment

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for accessibility, responsive states, API authority, and BFF boundaries.
- Long-context analysis: `glm-5-3-max`.
- Bounded fixes: `swe-2-high`.
- Escalation condition: stop if the pinned API contract, global-versus-household ownership, pantry-staple shortfall semantics, or existing ingredient edit permissions contradict this design.
- Model IDs follow the Web `AGENTS.md` matrix; the prior lead-authorized Spec Kit exception for unavailable `devin models list --format json` applies, so these IDs are not claimed as newly verified in this environment.

## API Contract Sequence

Copy `/home/ubuntu/repos/uribap-api/openapi/openapi.json` from API revision `e0e347a68ed7c9a3e386645e7058636897b8d567` into `contracts/uribap-api.openapi.json`, run `pnpm api:generate`, set `contracts/metadata.json` to that revision, schema version `v15`, and generated date `2026-10-06`, then update `tests/unit/api-contract.test.ts`.

The generated contract must expose:

- `IngredientCreate.pantry_staple`, `IngredientUpdate.pantry_staple`, and `IngredientResponse.pantry_staple`.
- `MealPlanEntryDetailIngredientResponse.pantry_staple`.
- `DemandForecastLine.pantry_staple`.

## Architecture

### Ingredient form and BFF

- Generalize `IngredientCreateForm` into `IngredientForm`, preserving its existing create use in the new-ingredient dialog and quick-recipe flow.
- Add the native checkbox label “Básico de despensa” and exact help text “No se descuenta al cocinar. Aparece en compras solo cuando se acaba.” It starts unchecked for creates and uses the API-provided Boolean for edits.
- Create requests include the Boolean in `IngredientCreate`; edit requests send `IngredientUpdate` with `PATCH /api/ingredients/{ingredientId}`.
- Keep the authenticated upstream call in the BFF. Add the dynamic PATCH Route Handler following the repository's current Next.js `params: Promise<...>` convention.
- Add an `IngredientEditDialog` for household-owned catalog rows. Keep all existing create and error feedback behavior; successful edits close the dialog, toast, and refresh server data.

### Ingredient catalog

- Type page results as generated `IngredientResponse` data.
- Render a small “Básico” badge next to flagged ingredient names.
- Render an edit control only when `household_id` is non-null. Keep global rows visible and read-only.
- Place the badge and edit action in the existing first table cell to avoid adding a column and increasing mobile width.

### Plan detail and forecast

- In `MealEntryDetailView`, when `pantry_staple` is true, render “Se acabó” if API `shortfall_amount` is positive, otherwise “Básico de despensa”; keep current available/missing labels for non-staples.
- Keep staple status visible for staple rows in recorded meal detail and clarify that only consumable ingredients are deducted.
- In `DemandTable`, use the same labels with the API staple flag and shortfall. Keep demand amounts and the existing visualization unchanged.
- Do not read `on_hand_amount` to decide the staple label and do not calculate stock, shortfall, or shopping amounts.

### Styling and accessibility

- Reuse native checkbox, associated label, and help-text `aria-describedby`.
- Reuse existing dialog focus, Escape, and return-focus behavior.
- Add restrained badge and checkbox-field styles beside ingredient/form rules, with wrapping behavior for narrow viewports.
- Keep status text in addition to color so the staple/out-of-stock distinction remains accessible.

## Test Plan

- `tests/component/ingredients/IngredientForm.test.tsx`: unchecked create default, exact help text, checked create payload, edit initialization and PATCH payload, error alert behavior.
- `tests/component/ingredients/IngredientTable.test.tsx`: flagged badge, no badge for ordinary ingredients, household edit action, and no edit action for a global ingredient.
- `tests/component/planning/MealEntryDetail.test.tsx`: stocked and empty staple labels, recorded-meal explanation, and unchanged non-staple labels.
- `tests/component/forecast/forecast.test.tsx`: stocked and empty staple labels plus unchanged non-staple labels.
- `tests/unit/api-contract.test.ts`: v15 metadata and required pantry-staple contract fields.

## Verification

Run the requested narrow feature gate:

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run --config vitest.config.mts tests/component/ingredients/IngredientForm.test.tsx tests/component/ingredients/IngredientTable.test.tsx tests/component/planning/MealEntryDetail.test.tsx tests/component/forecast/forecast.test.tsx tests/unit/api-contract.test.ts
pnpm api:check
pnpm build
git diff --check
```

Finish with `cmp /home/ubuntu/repos/uribap-api/openapi/openapi.json contracts/uribap-api.openapi.json`. Do not wait for CI. Visual inspection was not requested and will be reported as unverified.

## Constitution Check

- **API authority**: Staple status and shortfall come from API response fields.
- **Server/client boundary**: Ingredient listing remains server-loaded; create/edit interaction remains in the existing client dialog pattern, with mutations crossing the authenticated BFF.
- **Accessibility**: Checkbox has a visible label and help text; dialogs retain semantic labels and keyboard behavior; status is text, not color alone.
- **Responsive behavior**: The catalog action stays in its existing first cell; badge text wraps; plan and forecast rows retain their existing breakpoints.
- **Contract integrity**: All response and request types come from the pinned v15 OpenAPI snapshot.
- **Security**: Browser requests use same-origin BFF routes; upstream authorization remains server-side.

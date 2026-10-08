# Quickstart: Pantry Staple Ingredients

## Contract Setup

1. Use API revision `e0e347a68ed7c9a3e386645e7058636897b8d567`.
2. Copy `/home/ubuntu/repos/uribap-api/openapi/openapi.json` to `contracts/uribap-api.openapi.json`.
3. Run `pnpm api:generate`.
4. Set `contracts/metadata.json` and `tests/unit/api-contract.test.ts` to API revision `e0e347a68ed7c9a3e386645e7058636897b8d567`, schema `v15`, and date `2026-10-06`.

## Implementation Order

1. Add the form, catalog, plan-detail, and forecast component regressions.
2. Implement the typed create/edit checkbox and authenticated PATCH route.
3. Add the catalog badge and projection labels using API fields only.
4. Preserve global ingredient read-only behavior and existing non-staple labels.

## Verification

Run:

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run --config vitest.config.mts tests/component/ingredients/IngredientForm.test.tsx tests/component/ingredients/IngredientTable.test.tsx tests/component/planning/MealEntryDetail.test.tsx tests/component/forecast/forecast.test.tsx tests/unit/api-contract.test.ts tests/accessibility/planning.a11y.test.tsx
pnpm api:check
pnpm build
git diff --check
cmp /home/ubuntu/repos/uribap-api/openapi/openapi.json contracts/uribap-api.openapi.json
```

The branch is pushed after these checks pass; CI is not watched. The UI is not visually verified unless a separate rendered review is requested.

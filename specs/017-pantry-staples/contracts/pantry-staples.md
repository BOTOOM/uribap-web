# Pantry Staple Web Contract

The pinned API OpenAPI snapshot is authoritative. Do not hand-edit the generated contract or TypeScript client.

## Ingredient mutations and response

- `IngredientCreate.pantry_staple` is a Boolean with default `false`.
- `IngredientUpdate.pantry_staple` is optional.
- `IngredientResponse.pantry_staple` is always present.
- Household ingredient creation uses the existing same-origin `POST /api/ingredients` BFF route.
- Household ingredient edits use `PATCH /api/ingredients/{ingredientId}`. Global ingredients stay read-only.

## Projections

- `MealPlanEntryDetailIngredientResponse.pantry_staple` describes each ingredient in plan detail.
- `DemandForecastLine.pantry_staple` describes each forecast ingredient.
- Both projections include API-provided `shortfall_amount`.
- A staple with positive shortfall renders “Se acabó”; a staple without positive shortfall renders “Básico de despensa”.
- Non-staple presentation continues to use the existing available, covered, and missing states.

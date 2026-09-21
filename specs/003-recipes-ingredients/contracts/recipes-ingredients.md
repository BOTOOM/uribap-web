# Web Contract: Recipes and Ingredients

Routes:

- `/recetas`: searchable/filterable active recipe list.
- `/recetas/[recipeId]`: recipe detail and selected version.
- `/recetas/nueva`: authorized draft recipe form.
- `/ingredientes`: searchable ingredient catalog.

BFF handlers proxy authenticated API calls server-side. Public client props contain only safe DTOs; no access/refresh token or calculations. UI states map API `401/403/404/409/422/503` to semantic recovery states.

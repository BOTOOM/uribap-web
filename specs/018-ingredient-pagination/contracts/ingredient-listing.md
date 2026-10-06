# Ingredient Listing Contract

## Upstream API

The Web branch pins the OpenAPI document from API revision
`b0883cd34dbf4951283f8028239f60f4c3383e5d` in
`contracts/uribap-api.openapi.json`. The generated client is derived with `pnpm api:generate`;
the snapshot is not edited by hand.

### Request

- Method/path: `GET /ingredients` through `serverHouseholdFetch`.
- Page size: `limit=100`, regardless of any `limit` already present in the input path.
- Continuation: include the previous response's opaque `page_info.next_cursor` as `cursor`.
- Filters: preserve other input query parameters, including dimension, search, and global-visibility
  filters.
- Authorization: use the existing active-household server request context.

### Response

The API returns an `IngredientPage`:

- `items` contains the current page's `IngredientResponse` values.
- `page_info.next_cursor` is the next opaque cursor or `null` on the final page.
- The API's item ordering and filtering remain authoritative.

## Web Helper

```ts
listAllIngredients(path?: string): Promise<IngredientResponse[]>
```

- Default path: `"/ingredients"`.
- Server-only; calls `serverHouseholdFetch`.
- Fetches at most 50 pages and returns the concatenated `items` only after a null/absent next cursor.
- Preserves the supplied path and non-pagination query parameters.
- Throws on upstream failure or when a 50th page still has a next cursor.

## Call Sites

Use this helper only in the ingredient loaders for:

1. `src/app/(app)/ingredientes/page.tsx`
2. `src/app/(app)/inventario/page.tsx`
3. `src/app/(app)/plan/page.tsx`
4. `src/app/(app)/preparacion/page.tsx`
5. `src/app/(app)/recetas/[recipeId]/page.tsx`

Each loader retains its existing catch behavior. `src/app/api/ingredients/route.ts` is outside this
contract and remains unchanged.

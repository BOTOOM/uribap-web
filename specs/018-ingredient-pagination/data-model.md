# Data Model: Complete Ingredient Listings

## Persistence

This Web feature adds no persisted entities, database fields, or mutations. Ingredient records and
their ordering remain owned by the API.

## API Response Entities

### `IngredientPage`

- `items`: ordered array of `IngredientResponse` objects for the current page.
- `page_info`: `PageInfo` for the current result.

### `PageInfo`

- `limit`: page size supplied for the current request; the Web helper uses `100`.
- `next_cursor`: opaque string for the next page, or `null` when the listing is complete.

### `IngredientResponse`

The existing generated `IngredientResponse` schema is unchanged by this feature. The helper
aggregates these response objects without rewriting their fields or ordering.

## Helper Result

`listAllIngredients(path = "/ingredients")` returns one ordered
`IngredientResponse[]` containing every page's items exactly once for an unchanged catalog.

Input query parameters other than `limit` and the per-request `cursor` are preserved. `limit` is
set to `100`; each returned cursor is URL-encoded in the next request. The helper throws if the
50th response still indicates another page.

## Relationships and Rules

- A page belongs to one filtered ingredient listing and one active household request context.
- The response order is authoritative; the Web layer does not sort, deduplicate, or re-filter items.
- A failed page prevents a complete array from being returned.
- No snapshot guarantee is introduced if ingredients change while pages are being fetched.

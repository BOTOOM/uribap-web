# Research: Complete Ingredient Listings

## Decisions

### Use the API pagination contract as the only source of page boundaries

- **Decision**: Pin the Web contract to API commit
  `b0883cd34dbf4951283f8028239f60f4c3383e5d` and consume
  `IngredientPage.items` plus `page_info.next_cursor`.
- **Rationale**: The API owns the stable `(normalized_name, id)` ordering, filter behavior, and
  opaque cursor. The Web client must follow that contract rather than infer offsets or ordering.
- **Alternatives considered**: Requesting a larger `limit` than 100 is unsupported by the API's
  cap; client-side offset pagination would not match the API's keyset contract.

### Aggregate pages in a server-only helper

- **Decision**: Add `listAllIngredients(path = "/ingredients")` next to `server-client.ts` and
  call it from the five named Server Component page loaders.
- **Rationale**: This centralizes cursor handling while retaining the existing server-side
  household authorization boundary and lets each loader keep its current error result.
- **Alternatives considered**: Duplicating cursor loops in each page risks inconsistent filter and
  error behavior. Browser pagination would expose a private household-data retrieval path and
  require UI state the feature does not need.

### Preserve query parameters and encode the opaque cursor

- **Decision**: Parse the input path's query string, preserve its non-pagination parameters, set
  `limit=100`, and use `URLSearchParams` to replace `cursor` with each `next_cursor`.
- **Rationale**: Recipe and future callers can keep endpoint filters while the helper owns page
  size and continuation. The opaque cursor must not be corrupted by reserved URL characters.
- **Alternatives considered**: String concatenation does not safely encode all opaque cursor
  values. Discarding the query string would silently remove requested filters.

### Bound continuation and fail rather than report partial success

- **Decision**: Permit no more than 50 page requests and throw if page 50 still returns a cursor.
- **Rationale**: This supports up to 5,000 items and prevents a malformed or non-terminating cursor
  sequence from causing unbounded requests. Existing page loaders already define their own failure
  handling.
- **Alternatives considered**: Returning accumulated items after the cap would present an
  incomplete result as complete; an unbounded loop would have no termination protection.

### Keep page-specific failures unchanged

- **Decision**: Replace only each loader's fetch operation; retain its current error object or
  empty-array fallback.
- **Rationale**: The shared helper propagates a failed later page, while each page continues to
  present errors exactly as it does today.
- **Alternatives considered**: A single shared user-facing error policy would change existing page
  behavior beyond the pagination requirement.

## Repository Findings

- The five named pages currently call `serverHouseholdFetch` directly and consume only `items`
  from one response.
- `ingredientes/page.tsx` returns an error object on fetch failure; inventory, plan, and preparation
  use an empty-array fallback; recipe detail uses an empty ingredient list on failure and currently
  requests `/ingredients?limit=100`.
- `serverHouseholdFetch` resolves the active household and sends the household header through the
  existing server-side API client.
- The current pinned OpenAPI snapshot is v15 and models `IngredientPage.page_info` as an untyped
  object. The pagination API branch's contract must be copied and regenerated before product
  implementation so `next_cursor` is typed.
- `pnpm api:generate` runs `openapi-typescript` against
  `contracts/uribap-api.openapi.json`. `pnpm api:check` regenerates and checks for generated-schema
  drift.
- The repository uses Vitest for focused unit/component coverage and has an existing API-contract
  metadata test.

## Unresolved Research

None. The API pagination behavior, Web helper signature, page list, cap, query preservation, and
error behavior are specified by the feature request.

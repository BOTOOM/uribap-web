# Quickstart: Complete Ingredient Listings

## Prerequisites

- Use the Web feature branch `devin/1791307670-ingredient-pagination`.
- API pagination is available at revision
  `b0883cd34dbf4951283f8028239f60f4c3383e5d`.
- The Web dependency installation is available through pnpm.

## Contract Setup

1. Copy the API revision's `openapi/openapi.json` to
   `contracts/uribap-api.openapi.json`.
2. Update contract metadata to API revision `b0883cd34dbf4951283f8028239f60f4c3383e5d`, schema
   `v16`, and date `2026-10-06`.
3. Run `pnpm api:generate` and update the contract metadata unit assertion.
4. Confirm the generated `IngredientPage.page_info` uses `PageInfo.next_cursor`.

## Focused Validation

```bash
pnpm exec vitest run --config vitest.config.mts tests/unit/api/list-all-ingredients.test.ts tests/unit/api-contract.test.ts
pnpm lint
pnpm typecheck
pnpm api:check
pnpm build
```

Expected helper behavior:

- Three pages are combined in order and terminate on a null cursor.
- An initial null cursor makes exactly one request.
- A continuation failure rejects instead of returning earlier items.
- A cursor containing reserved URL characters survives query encoding unchanged when parsed.
- A next cursor on page 50 raises instead of returning a truncated array.
- Other path query parameters are present in every page request.

## Feature Verification

Invoke `/uribap-web-testing` and record each executed/skipped gate in `converge.md`. Compare the
final contract snapshot byte-for-byte with the API branch's `openapi/openapi.json`; run
`git diff --check` before commit and push.

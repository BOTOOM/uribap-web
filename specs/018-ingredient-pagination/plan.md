# Implementation Plan: Complete Ingredient Listings

**Branch**: `devin/1791307670-ingredient-pagination` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: [Feature specification](./spec.md)

## Summary

Pin the Web client to API pagination revision `74b661925fdec990c386850b90906664bb78b74f`,
regenerate its OpenAPI-derived types, and add a server-only helper that gathers every ingredient
page. Replace the direct one-page ingredient requests on the five specified server-rendered pages,
retaining their existing local error handling.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Next.js 16.3.6.

**Primary Dependencies**: Next.js App Router, `getActiveHouseholdId`, `serverApiFetch`, generated
OpenAPI types, Vitest, pnpm.

**Storage**: No Web-owned ingredient storage; FastAPI remains authoritative.

**Testing**: Vitest unit/component tests, ESLint, TypeScript, OpenAPI generation check, Next.js
production build, and the `/uribap-web-testing` workflow.

**Target Platform**: Next.js server-rendered application on the repository's existing Vercel and
Docker targets.

**Project Type**: Web application.

**Performance Goals**: A 140-item household catalog completes in two sequential page requests at
100 items per page. Stop after at most 50 pages.

**Constraints**:

- Resolve the active household once with `getActiveHouseholdId()` and use `serverApiFetch` with an
  explicit `X-Household-ID` header from the server-only helper; do not expose access tokens or move
  ingredient retrieval into browser code.
- Preserve all query parameters supplied to `listAllIngredients`, override `limit` to 100, and
  carry each returned cursor through URL-safe query encoding.
- Throw if the 50th page still reports another cursor; never return a truncated result as complete.
- Change only ingredient retrieval on the five named pages and keep each page's existing catch and
  error-state behavior.
- Leave `src/app/api/ingredients/route.ts` untouched.
- Generate the API client from the pinned contract; do not hand-edit OpenAPI or generated schema.
- Preserve the pre-existing untracked `src/app/dev-preview/` directory without staging it.

**Scale/Scope**: One helper, five server-rendered pages, one focused helper test file, and the
contract metadata/schema test. Maximum supported traversal is 5,000 ingredients.

## Model Assignment

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for server boundaries, accessibility, and responsive-state review.
- Long-context analysis: `glm-5-3-max`.
- Bounded fixes: `swe-2-high`.
- Escalation condition: stop if the pinned API does not expose the specified cursor/page contract or
  if preserving page-local error semantics requires changing unrelated product behavior.
- Model identifiers are cited from the Web `AGENTS.md` guide per the owner decision; no
  `devin models list` verification is required or run. The pantry-derived branch retains an older
  constitution sentence requiring CLI verification; the owner's Part 2 decision explicitly
  supersedes that sentence for this plan.

## Constitution Check

*GATE: Pass before research; re-evaluate after design.*

- **API is the source of truth**: the helper only aggregates ingredient response items and does not
  calculate or alter business data.
- **Server-first performance**: all five call sites are Server Components; the helper uses the
  existing authenticated household fetch boundary.
- **Accessible task completion**: no new controls or visual interaction are added; existing page
  states and text remain in place.
- **Contract and state coverage**: update the pinned API revision, regenerate its typed client, and
  preserve each page's current error handling if any page in the traversal fails.
- **Responsive behavior**: no layout changes are planned.
- **Security**: keep credentials server-side and mark the helper as server-only.
- **Model policy**: cite model IDs from the guide without CLI verification, as explicitly decided by
  the owner, superseding the older sentence in the pantry-derived branch's constitution.

No product-design constitution gate requires an exception.

## API Contract Sequence

1. Copy `openapi/openapi.json` from API revision
   `74b661925fdec990c386850b90906664bb78b74f` to
   `contracts/uribap-api.openapi.json`.
2. Update `contracts/metadata.json` to that API revision, schema version `v16`, and generation date
   `2026-10-06`; update the pinned metadata assertions in `tests/unit/api-contract.test.ts`.
3. Run `pnpm api:generate`; the generated `IngredientPage` must expose `items` and typed
   `page_info.next_cursor`, with `null` marking the final page.
4. Finish with `cmp` against the exact API branch OpenAPI file.

## Architecture

### Server-only aggregation

- Add `src/lib/api/list-all-ingredients.ts` beside `server-client.ts`, with a server-only marker.
- Export `listAllIngredients(path = "/ingredients")`, returning generated
  `IngredientResponse[]`.
- Parse the provided path's search parameters, preserve filters and other parameters, and set
  `limit=100`.
- Resolve the active household once before traversal, then fetch each page with
  `serverApiFetch<IngredientPage>` and an explicit `X-Household-ID` header. Append items in response
  order and replace the cursor with `page_info.next_cursor` until it is null or absent. Reusing the
  resolved household ID keeps every page in the traversal scoped to the same household without
  re-resolving membership for each request.
- Use a maximum of 50 requests. Throw when page 50 still supplies a cursor.
- Use `URLSearchParams` so opaque cursors are percent-encoded correctly.

### Page integration and error handling

Replace only the ingredient fetch inside the existing loader functions in:

- `src/app/(app)/ingredientes/page.tsx`
- `src/app/(app)/inventario/page.tsx`
- `src/app/(app)/plan/page.tsx`
- `src/app/(app)/preparacion/page.tsx`
- `src/app/(app)/recetas/[recipeId]/page.tsx`

Keep each loader's current `try`/`catch` result shape unchanged: the catalog returns its existing
error object; inventory, plan, preparation, and recipe loaders keep their existing empty-list
fallbacks. Preserve the recipe page's existing `limit=100` query as an input to the shared helper.
Do not edit the ingredient POST route.

### Tests

- Add `tests/unit/api/list-all-ingredients.test.ts`.
- Mock `getActiveHouseholdId` and `serverApiFetch`; cover a three-page traversal, termination on
  `null`, the 50-page overflow error, continuation failures without partial results, initial-page
  termination, cursor encoding, retention of unrelated query parameters, and the explicit
  household header.
- Update `tests/unit/api-contract.test.ts` for the API revision/schema v16 and cursor contract.
- Keep product implementation out of scope until the Spec Kit analysis gate is complete.

## Verification Plan

Run focused helper and contract tests, then the repository gates:

```bash
pnpm exec vitest run --config vitest.config.mts tests/unit/api/list-all-ingredients.test.ts tests/unit/api-contract.test.ts
pnpm lint
pnpm typecheck
pnpm api:check
pnpm build
pnpm exec playwright test --list
```

Invoke `/uribap-web-testing` before convergence and report any unavailable gate with its concrete
reason. Also run `cmp` against the pinned API branch and `git diff --check`. The API generation
check must be run when the generated schema has no unstaged drift (stage the generated file or run
after its commit), because the repository script compares it with the Git worktree.

## Project Structure

```text
specs/018-ingredient-pagination/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ingredient-listing.md
├── tasks.md
├── analysis.md
└── converge.md

src/lib/api/list-all-ingredients.ts
src/app/(app)/ingredientes/page.tsx
src/app/(app)/inventario/page.tsx
src/app/(app)/plan/page.tsx
src/app/(app)/preparacion/page.tsx
src/app/(app)/recetas/[recipeId]/page.tsx
tests/unit/api/list-all-ingredients.test.ts
tests/unit/api-contract.test.ts
```

## Post-Design Constitution Check

- **API authority**: maintained; no browser calculations or partial-success projection.
- **Server-first and security**: maintained; authenticated server fetch stays server-side.
- **Contract integrity**: the generated schema is tied to the API pagination commit and exact
  OpenAPI snapshot.
- **State behavior**: page-local empty/error handling is unchanged when aggregation throws.
- **Accessibility and responsive behavior**: no new interaction or layout is added; existing page
  output is retained.

All design gates pass; no complexity exception is required.

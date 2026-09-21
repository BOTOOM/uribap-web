# Converge: Shopping Web

## Scope delivered

- `contracts/` — OpenAPI snapshot synced to API `shopping-projection-64ade21`,
  `schemaVersion` bumped to `v7`, `contract.yml` pinned to
  `stack/007-api-shopping-service` while the API stack is open.
- `src/app/api/shopping-lists/` — BFF route handlers for list creation, list
  transitions (`complete`/`reopen`/`archive`), and item actions
  (`purchase`/`skip`/`restore`); session token and `X-Household-ID` stay server-side
  via `serverHouseholdFetch`, `Idempotency-Key` is forwarded or generated per request.
- `src/app/(app)/compra/page.tsx` — server component that loads
  `/shopping-lists/current`, renders generate-form empty state, `ErrorState` on API
  failure, pending/resolved item sections, and the transition bar.
- `src/components/shopping/` — `ShoppingListCreateForm` (window picker),
  `ShoppingListTransitionBar` (state-driven actions, stable idempotency key per
  mount, `409` → inline reload), `ShoppingItemActions` (skip/restore plus a purchase
  form with quantity, location, optional expiration and notes; unit is locked to the
  item unit and every mutation sends `expected_version`).

## Verification

All gates in `quickstart.md` pass: api:check, lint, typecheck, 34 Vitest tests,
Playwright (8 pass / 7 opt-in skipped), axe a11y, production build, audit, licenses,
and performance budget.

## Design notes

- The UI performs no projection, inventory, or shopping calculations — it renders
  API-provided `needed_amount`/`purchased_amount`/status verbatim.
- Every mutation re-reads `expected_version` from the server-rendered list; a `409`
  surfaces the conflict with an explicit reload action, per the shared-state
  requirement.
- No provider or API token reaches the browser; all calls go through the BFF.

## Remaining work

- Post-merge contract cleanup PR: `contract.yml` `ref` back to `main` and
  `apiRevision` to the squashed API 007 commit, mirroring phases 004–006.
- Opt-in local E2E (`RUN_SHOPPING_E2E=1`) requires an authenticated local stack and
  stays gated as in previous phases.

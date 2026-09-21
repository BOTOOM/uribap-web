# Converge: Meal Completion Web Experience

## Scope delivered

- Contract layer — pinned `contracts/uribap-api.openapi.json` to API 009 revision
  `completion-1de4a64` (`schemaVersion v9`), regenerated
  `src/lib/api/generated/schema.ts`, and pointed `contract.yml` `ref` at the API
  completion stack until merge.
- BFF boundary — `POST /api/plans/{planId}/entries/{entryId}/complete`,
  `GET /api/meal-completions` (query passthrough),
  `POST /api/meal-completions/{id}/lines/{lineId}/correct`, and
  `POST /api/meal-completions/{id}/reopen`, all forwarding `Idempotency-Key` and
  returning the API status.
- `/plan` — approved-plan entries without a recorded completion render a
  `Completar comida` action (planned-default submit); a `Comidas completadas`
  section lists this plan's completions with per-line planned-vs-actual display
  (diff shown when actuals differ), inline `CorrectLineForm` and
  `ReopenCompletionButton` on `recorded` rows, and read-only `reopened` rows.
- Conflict handling — every mutation surfaces `409` (stale `expected_version`,
  insufficient stock, already completed) as a reload affordance; API errors map
  to `role="status"`/`role="alert"` messages.

## Verification

All gates in `quickstart.md` pass: `api:check`, `lint`, `typecheck`, `pnpm test`
(49 tests / 18 files), `build`, `licenses`, `performance`, `audit`, a11y; e2e
suite green with opt-in specs skipped like the rest.

## Design notes

- No consumption or reconciliation math lives in React — planned vs actual is a
  plain display comparison of API-provided amounts (FR-003).
- The complete action sends `{}` and lets the API default to planned amounts;
  actuals are adjusted afterwards through line corrections, keeping the primary
  flow one click.
- Completions render on `/plan` only — they are entry-bound, so no new top-level
  navigation surface was added.

## Remaining work

Post-merge cleanup: point `contract.yml` `ref` back to `main` and update
`apiRevision` to the merged API SHA.

# Converge: Preparation Web Experience

## Scope delivered

- Contract layer — pinned `contracts/uribap-api.openapi.json` to API 008 revision
  `preparation-bd7bff0` (`schemaVersion v8`), regenerated
  `src/lib/api/generated/schema.ts`, and pointed `contract.yml` `ref` at the API
  preparation stack until merge.
- BFF boundary — `POST /api/preparation-tasks` and
  `POST /api/preparation-tasks/{taskId}/{action}` (`complete`/`cancel`), forwarding
  `Idempotency-Key` and returning the API status.
- `/preparacion` — server component listing pending and resolved tasks in API order;
  derived rows render recipe name, meal type, and planned date; pending rows show an
  overdue badge when `due_at` is in the past (display comparison only, per FR-003);
  explicit empty state explains tasks derive from approved plans.
- Client leaves — `PreparationTaskActions` sends `expected_version` from the loaded
  row with a stable `Idempotency-Key`, surfaces a reload affordance on `409`;
  `ManualTaskForm` posts title/due_at/instruction/ingredient/amount+unit and resets
  on success.

## Verification

All gates in `quickstart.md` pass: `api:check`, `lint`, `typecheck`, `pnpm test`
(44 tests / 17 files), `build`, `licenses`, `performance`. The e2e spec is opt-in
like the rest of the suite.

## Design notes

- No due-time arithmetic, ordering, or domain rule lives in React — the API order
  and `due_at` are authoritative; the only client-side comparison is the overdue
  display badge, computed in the loader to satisfy `react-hooks/purity`.
- Recipe preparation-rule editing stays API-side this phase (FR-007); recipe
  authoring UI evolves separately.

## Remaining work

Post-merge cleanup: point `contract.yml` `ref` back to `main` and update
`apiRevision` to the merged API SHA.

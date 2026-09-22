# Tasks: Household Activity Web Experience

## Contract

- T001 Sync OpenAPI from the API service branch; bump metadata to `v10` +
  `events-*`; update workflow `ref` and the contract test.

## UI

- T002 BFF route `GET /api/households/activity` with `page`/`page_size`
  passthrough and Problem Details mapping.
- T003 `/settings/household` activity section: server-loaded first page,
  kind→label map, outbox status summary with suppression hint, `Cargar más`
  client control, shared loading/empty/error/forbidden states.
- T004 Component tests, a11y spec; full gates (`api:check`, lint, typecheck,
  test, e2e, a11y, build, audit, licenses, performance).

## Converge

- T005 Convergence artifact + cleanup PR restoring workflow `ref: main` and
  `apiRevision` to the merged API SHA.

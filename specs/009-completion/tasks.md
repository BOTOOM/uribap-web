# Tasks: Meal Completion Web Experience

## Contract

- T001 Sync OpenAPI from the API service branch; bump metadata to `v9` +
  `completion-*`; update workflow `ref` and the contract test.

## UI

- T002 BFF routes: `POST /plans/{id}/entries/{id}/complete`,
  `POST /meal-completions/{id}/lines/{id}/correct`,
  `POST /meal-completions/{id}/reopen`, `GET /meal-completions` — forward
  `Idempotency-Key`, map Problem Details.
- T003 `/plan` integration: complete action on approved entries (planned-default
  submit + optional actual editor), completions section with planned-vs-actual
  lines, correct form, reopen action, conflict/reload states.
- T004 Component tests, opt-in e2e, a11y spec; full gates (`api:check`, lint,
  typecheck, test, e2e, a11y, build, audit, licenses, performance, Docker).

## Converge

- T005 Convergence artifact + cleanup PR restoring workflow `ref: main` and
  `apiRevision` to the merged API SHA.

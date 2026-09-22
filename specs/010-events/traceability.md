# Traceability: Household Activity Web

| Spec item | Artifact | Evidence |
| --- | --- | --- |
| US1 activity feed | FR-001/003, `GET /api/households/activity` | page + component tests |
| US2 outbox summary | FR-004, `OutboxSummary` | suppression-hint render test |
| US3 pagination | `has_more` contract | LoadMore component test |
| US4 states | FR-004 | shared state component tests |
| Contract v10 | FR-001 | `api:check` + contract test |

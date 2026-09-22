# Analysis: Meal Completion Web

## Coverage

| Requirement | Covered by |
| --- | --- |
| FR-001 contract v9 | T001 |
| FR-002 versions + idempotency | T002–T003 |
| FR-003 API-authoritative | T003 (no client math) |
| FR-004 states | T003–T004 |
| FR-005 approved-only | T003 |
| FR-006 a11y/responsive | T004 |

## Consistency checks

- All mutation fields come from server-loaded `version`; the browser never
  invents versions or recomputes consumption.
- The conflict path reuses the shared stale-data affordance from
  inventory/planning/shopping/preparation.
- Completions render on `/plan` only; other pages unchanged.

## Resolved questions

- *Separate page?* No — completions are entry-bound and stay on `/plan`.
- *Edit actuals at complete time?* Optional line editor; default submit uses
  planned amounts.
- *Show reopened rows?* Yes, read-only, so members see the reversal happened.

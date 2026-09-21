# Analyze: Preparation Web

## Consistency

- FR-003 allows one display comparison (`due_at` vs now for the overdue badge) while
  forbidding domain math — consistent because the badge is presentational only and
  never feeds a request.
- FR-007 defers rule editing UI while API 008 manages rules — tasks still render
  because derivation needs no Web surface.
- Conflict handling mirrors shopping/planning (`409` → inline reload), consistent
  with the shared stale-state requirement.

## Risks

- `due_at` rendering depends on locale formatting; ISO display keeps it unambiguous.
- Task lists can grow; this phase renders the API-ordered page without pagination
  (acceptable per spec, flagged for later phases).

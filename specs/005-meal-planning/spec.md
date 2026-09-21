# Feature Specification: Meal Planning Web Experience

**Feature Branch**: `005-meal-planning`

- **US1**: Browse the current week's plan grouped by day and meal type with state (`draft`, `proposed`, `approved`, `archived`) and version visible.
- **US2**: Add, edit, and remove planned meals while the plan is `draft`, choosing from published recipe versions.
- **US3**: Propose, approve, reopen, or archive the plan through explicit actions; self-approval is rejected when another member exists.
- **US4**: A stale `expected_version` produces a conflict state with a reload path, never a silent overwrite.

Web MUST use generated API types, send `expected_version` from server-loaded data, never derive plan state or demand in React, expose loading/empty/error/forbidden/conflict states, meet keyboard/a11y/responsive gates, and exclude email/notifications/deployment.

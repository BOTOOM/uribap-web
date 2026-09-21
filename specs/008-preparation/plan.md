# Plan: Preparation Web Experience

Replace the `/preparacion` placeholder with a server-rendered task list: pending tasks
by `due_at` with overdue marking, resolved tasks, a manual-task form, and per-item
actions via BFF route handlers under `/api/preparation-tasks/*` forwarding
`Idempotency-Key` and `expected_version`. No domain math in Web — `due_at`, status,
and origin fields come verbatim from the pinned contract; the only client-side
comparison is `due_at < now` for the overdue badge.

## Model policy

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for permissions, accessibility, responsive states, and BFF boundaries.
- Analysis/subagent: `glm-5-3-max` for long artifact review.
- Bounded fixes: `swe-2-high`; escalate only when a cross-route architecture decision is required.
- Escalation condition: stop if API authority, token isolation, version conflict handling, keyboard operation, or responsive state behavior cannot be demonstrated.

## Delivery controls

- `pnpm api:check`, lint, typecheck, Vitest, Playwright, axe, responsive viewports 375/768/1024/1440, build, Docker health, audit, licenses, and performance budget.
- Verify loading, empty, forbidden, version-conflict, per-status, overdue, keyboard, reduced-motion, and no-horizontal-overflow states.
- Email delivery, notifications, and deployment are explicitly out of scope for this phase.

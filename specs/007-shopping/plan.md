# Plan: Shopping Web Experience

Replace the `/compra` placeholder with a server-rendered shopping list: pending/purchased/skipped items, a generate-list empty state keyed to plan weeks, and a transition bar. Client islands handle purchase forms, skip/restore, and transitions via BFF route handlers under `/api/shopping-lists/*` forwarding `Idempotency-Key` and `expected_version`. No demand or inventory math in Web — every amount and status comes from the pinned contract.

## Model policy

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for permissions, accessibility, responsive states, and BFF boundaries.
- Analysis/subagent: `glm-5-3-max` for long artifact review.
- Bounded fixes: `swe-2-high`; escalate only when a cross-route architecture decision is required.
- Escalation condition: stop if API authority, token isolation, version conflict handling, keyboard operation, or responsive state behavior cannot be demonstrated.

## Delivery controls

- `pnpm api:check`, lint, typecheck, Vitest, Playwright, axe, responsive viewports 375/768/1024/1440, build, Docker health, audit, licenses, and performance budget.
- Verify loading, empty, generate, forbidden, version-conflict, per-status, keyboard, reduced-motion, and no-horizontal-overflow states.
- Email delivery, notifications, and deployment are explicitly out of scope for this phase.

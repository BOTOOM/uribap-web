# Plan: Inventory Web Experience

Add `/inventario` server page, lot/adjustment client forms, movement detail, and BFF handlers using the API 004 snapshot. Server Components load authoritative balances; client islands handle forms and feedback only. No inventory arithmetic in Web.

## Model policy

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for permissions, accessibility, responsive states, and BFF boundaries.
- Analysis/subagent: `glm-5-3-max` for long artifact review.
- Bounded fixes: `swe-2-high`; escalate only when a cross-route architecture decision is required.
- Escalation condition: stop if API authority, token isolation, keyboard operation, or responsive state behavior cannot be demonstrated.

## Delivery controls

- `pnpm api:check`, lint, typecheck, Vitest, Playwright, axe, responsive viewports 375/768/1024/1440, build, Docker health, audit, licenses, and performance budget.
- Verify loading, empty, unavailable, forbidden, conflict, success, reduced-motion, keyboard, and no-horizontal-overflow states.
- Email delivery and deployment are explicitly out of scope for this phase.

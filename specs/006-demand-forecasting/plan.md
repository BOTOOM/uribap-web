# Plan: Demand Forecast Web Experience

Add a server-rendered `/forecast` page that loads `GET /api/v1/forecast/demand` through a BFF route handler `/api/forecast/demand` forwarding `from_date`/`to_date` and auth. A small client island handles previous/next-week navigation via URL search params; the table renders API-verbatim lines with a shortfall badge. The app nav gains a forecast link. No forecasting math in Web — every number comes from the pinned contract types.

## Model policy

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for permissions, accessibility, responsive states, and BFF boundaries.
- Analysis/subagent: `glm-5-3-max` for long artifact review.
- Bounded fixes: `swe-2-high`; escalate only when a cross-route architecture decision is required.
- Escalation condition: stop if API authority, token isolation, keyboard operation, or responsive state behavior cannot be demonstrated.

## Delivery controls

- `pnpm api:check`, lint, typecheck, Vitest, Playwright, axe, responsive viewports 375/768/1024/1440, build, Docker health, audit, licenses, and performance budget.
- Verify loading, empty, unavailable, forbidden, shortfall-highlight, keyboard, reduced-motion, and no-horizontal-overflow states.
- Email delivery, notifications, and deployment are explicitly out of scope for this phase.

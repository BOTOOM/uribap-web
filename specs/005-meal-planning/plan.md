# Plan: Meal Planning Web Experience

Replace the `/plan` placeholder with a server-rendered week plan: day-grouped entries, state badge, and version-aware mutations. Client islands handle entry add/edit/remove and transition actions, calling BFF route handlers under `/api/plans/*` that forward `Idempotency-Key` and `expected_version` to the API. Recipe selection uses `GET /api/v1/recipes/published-versions`, added by the API 005 service layer because the 003 contract only exposed `latest_version` numbers. No planning or demand logic in Web.

## Model policy

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for permissions, accessibility, responsive states, and BFF boundaries.
- Analysis/subagent: `glm-5-3-max` for long artifact review.
- Bounded fixes: `swe-2-high`; escalate only when a cross-route architecture decision is required.
- Escalation condition: stop if API authority, token isolation, version conflict handling, keyboard operation, or responsive state behavior cannot be demonstrated.

## Delivery controls

- `pnpm api:check`, lint, typecheck, Vitest, Playwright, axe, responsive viewports 375/768/1024/1440, build, Docker health, audit, licenses, and performance budget.
- Verify loading, empty, unavailable, forbidden, version-conflict, success, reduced-motion, keyboard, and no-horizontal-overflow states.
- Email delivery, notifications, and deployment are explicitly out of scope for this phase.

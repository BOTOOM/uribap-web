# Convergence: Meal Planning Web

**Status**: Implementation complete pending stack merge.

## Implemented

- `/plan` server component loads the current-week plan (404 → create-plan empty state), the published recipe-version picker (`/recipes/published-versions`), groups entries by planned date, renders localized meal/state labels, and states explicitly that planned meals are projected demand — never inventory deductions.
- BFF route handlers proxy plan CRUD, entry add/update/remove, and `propose`/`approve`/`reopen`/`archive` transitions with bearer-token isolation and `Idempotency-Key` forwarding.
- Client components: create-plan button, entry form (published-version picker, optimistic `expected_version`), entry actions, and transition bar; all refresh via `router.refresh()` after mutations.
- Generated `components["schemas"]` types drive every payload; no planning math in React.
- Tests: component coverage for forms/actions, accessibility checks, and a Playwright spec gated on the authenticated local session.

## Evidence

- All Web gates pass locally; see `specs/005-meal-planning/quickstart.md`.

## Remaining

- Authenticated planning E2E remains opt-in until a reusable local session fixture exists (same posture as phase 004).
- Merge order: this stack before the API stack while `contract.yml` compares against `stack/005-api-planning-service`, then a cleanup PR returns `ref: main`.
- No email delivery or deployment is part of this feature.

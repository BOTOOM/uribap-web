# Quickstart: Meal Detail Modal

## Local development

1. Use the isolated `devin/1791403355-meal-detail-modal` worktree and install dependencies with `pnpm install --frozen-lockfile` if they are not present.
2. Run the focused component/accessibility suite:

   ```bash
   pnpm exec vitest run --config vitest.config.mts \
     tests/component/planning/plan-board.test.tsx \
     tests/component/dashboard/home-meal-list.test.tsx \
     tests/accessibility/planning.a11y.test.tsx
   ```

3. Run the requested quality checks:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   pnpm test:a11y
   git diff --check
   pnpm test
   ```

   The full test suite is run once, at the end.

## Local rendered preview

1. Keep `src/app/dev-preview/meal-modal/page.tsx` local-only; do not stage or commit it.
2. Start the preview server from this worktree:

   ```bash
   pnpm dev -- --port 3100
   ```

3. Open `http://localhost:3100/dev-preview/meal-modal`. The fixture contains about four plan meals on the current day and cooked, skipped, and pending home rows. A local fetch mock returns detail data without a backend.
4. Confirm the route is reachable without authentication, open a plan card and a home row, and verify the dialog content can be scrolled.
5. Leave the server running for the lead's review.

## E2E gate

`e2e/plan-detail.spec.ts` remains gated by its existing `RUN_PLANNING_E2E=1` and authenticated local-stack requirements. The test change asserts a visible dialog and checks horizontal overflow at the existing 375px and 1440px viewports.

## Scope guardrails

- Do not change OpenAPI snapshots, BFF routes, `MealEntryDetail` fetching/actions, or home date/loading logic.
- Do not stage `next-env.d.ts` or any `src/app/dev-preview` fixture.
- Do not create or update a PR or wait for CI after pushing.

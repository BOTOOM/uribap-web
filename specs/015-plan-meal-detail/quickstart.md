# Quickstart — Plan Meal Detail and Completion Outcomes

1. Use the post-dependency API branch head `03dcb972b7fdc5a3d341894a80a4eabcebf32605`.
2. Copy `openapi/openapi.json` from that API revision to
   `contracts/uribap-api.openapi.json`, run `pnpm api:generate`, and pin metadata to
   schema `v13`, the API revision above, and date `2026-10-01`.
3. Update the API contract metadata test and add the feature component, unit, and accessibility
   tests before implementing the UI. Add the gated `e2e/plan-detail.spec.ts` smoke test alongside
   `e2e/planning.spec.ts`.
4. Run:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm api:check
   pnpm build
   git diff --check
   ```

5. Keep `src/app/dev-preview/plan/page.tsx` out of Git, start `pnpm dev`, and leave
   `http://localhost:3000/dev-preview/plan` reachable for rendered review.
6. The plan-detail E2E test is skipped unless `RUN_PLANNING_E2E=1` and an authenticated local API
   stack are available. Do not launch Docker or an API/identity stack for this feature.
7. The lead will render the preview at 375, 768, 1024, and 1440px after push; keep that review open
   in `converge.md` until the lead records it.

No Docker, authenticated API stack, or live identity-provider checks are part of this feature's
default verification scope. Record the intentionally gated E2E status and the lead's rendered
review in `converge.md`.

## Verification Record — 2026-10-01

- `pnpm lint`, `pnpm typecheck`, `pnpm api:check`, `pnpm test`, and `pnpm build` passed.
- The full component/unit suite passed: 184 tests across 38 files. This includes the semantic
  accessibility checks in `tests/accessibility/planning.a11y.test.tsx`.
- `pnpm exec next typegen` refreshed stale ignored route-type output before typecheck; it is
  environment-generated and not part of the feature diff.
- The gated E2E and browser-only accessibility checks were not run; Docker and authenticated
  services were not started, per the implementation scope.
- `src/app/dev-preview/plan/page.tsx` remains uncommitted. `pnpm dev` is running on port 3000,
  and `http://localhost:3000/dev-preview/plan` returned HTTP 200.
- The implementation agent did not perform a rendered viewport review. The lead's four-viewport
  review remains open in `converge.md`.

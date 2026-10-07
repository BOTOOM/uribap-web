# Convergence: Meal Detail Modal

## Scope

- Plan-board meal detail opens only in the shared modal after an explicit card activation.
- Home “Hoy” and “Mañana” rows open the same detail without route navigation.
- Only recorded completion state is projected to home row status chips.
- API contract, detail fetch/actions, home date/loading logic, and other dashboard content remain unchanged.

## Verification Record

Implementation and the requested local verification are complete. The local preview remains running on port 3100.

| Check | Result | Evidence |
|---|---|---|
| Focused Vitest files | PASS | 3 files, 26 tests |
| `pnpm lint` | PASS | Exit code 0 |
| `pnpm typecheck` | PASS | Exit code 0 |
| `pnpm build` | PASS | Next.js production build completed; preview route was generated |
| `pnpm test:a11y` | PASS | 1 Playwright accessibility test passed |
| `git diff --check` | PASS | Exit code 0 |
| Full `pnpm test` (last test gate) | PASS | 56 files, 281 tests |
| Local preview on port 3100 | PASS | HTTP 200, no redirects; rendered fixture statuses included “Cocinada”, “Domicilio”, and “Planeada” |

`pnpm test:e2e`, `pnpm api:check`, Docker health, audit, license, and performance gates were not part of the task's requested verification sequence and were not run. The planning E2E test remains gated by its existing authenticated `RUN_PLANNING_E2E` requirement.

## Browser Review

- Gated E2E remains under `RUN_PLANNING_E2E=1`; the gate was preserved and the authenticated E2E was not run.
- `http://localhost:3100/dev-preview/meal-modal` returned HTTP 200 with no redirects and fixture-specific status text, confirming it loads without authentication. The dev server is still running.
- The requested `pnpm dev -- --port 3100` invocation passed an extra `--` to Next.js and exited with an invalid-project-directory error; `pnpm dev --port 3100` started the server successfully.
- No interactive visual inspection or screenshot was performed; the preview is visually unverified.

## Commits and Delivery

Pending. Commit documentation first as `docs(020): specify meal detail modal`, then product changes as `feat(plan): open meal detail in a modal`. Exclude `next-env.d.ts` and all `src/app/dev-preview` fixtures, push the feature branch, and do not wait for CI.

## Open Items

- Complete the ordered commits and push; do not wait for CI.
- Report the gated E2E and visual-verification limitations explicitly; do not mark an unrun authenticated flow as passed.

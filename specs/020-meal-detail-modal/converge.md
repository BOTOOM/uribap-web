# Convergence: Meal Detail Modal

## Scope

- Plan-board meal detail opens only in the shared modal after an explicit card activation.
- Home “Hoy” and “Mañana” rows open the same detail without route navigation.
- Only recorded completion state is projected to home row status chips.
- API contract, detail fetch/actions, home date/loading logic, and other dashboard content remain unchanged.

## Verification Record

Initial implementation and its requested local verification are complete. No `:3100` preview server was started for the focus-restoration review follow-up, as requested.

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

Completed in order:

1. `6a7bc8f` — `docs(020): specify meal detail modal`
2. `43213b6` — `feat(plan): open meal detail in a modal`
3. `8a09bf9` — `docs(020): record meal modal delivery`
4. `674b266` — `fix(plan): keep meal detail close button visible`

All four commits were pushed to `devin/1791403355-meal-detail-modal`. `next-env.d.ts` and all `src/app/dev-preview` fixtures were excluded. No PR was created and CI was not watched.

## Open Items

- None. The gated E2E and visual-verification limitations are recorded above.

## Review follow-up: focus restoration

- `MealDetailDialog` restores focus to the latest entry trigger when it remains present. When refreshed data removes it, PlanBoard supplies its active day selector and HomeMealList supplies its own `.meal-list` container as fallback; no global fallback selector is used.
- PlanBoard and HomeMealList component tests cover Enter-to-open, Escape and Cerrar focus return, and deleted-entry fallback focus. Accessibility tests retain the direct-dialog axe test and add keyboard-opened PlanBoard/HomeMealList scans with focus-return assertions.
- Focused Vitest: PASS — 3 files, 29 tests. Full `pnpm test`: PASS — 56 files, 285 tests.
- `pnpm lint`, `pnpm typecheck`, `pnpm api:check`, `pnpm build`, and `pnpm test:a11y`: PASS.
- `pnpm test:e2e`: PASS — 8 passed, 13 skipped; responsive checks covered 375, 768, 1024, and 1440px. The authenticated planning E2E remains gated.
- `pnpm licenses:check`: PASS — 14 license families. `pnpm performance:check`: PASS — 1,064,193 / 2,000,000 bytes.
- Docker health: BLOCKED — `docker compose up -d --build` requires the absent `.env.local`; `docker compose ps` showed no services.
- `pnpm audit`: FAIL — 9 findings (1 low, 4 moderate, 4 high); the high findings include braces, source-map-js, sharp, and Next.js SSRF (`GHSA-cjq9-62q9-8jv4`). No dependency files changed in this follow-up.
- `git diff --check`: PASS — exit code 0.

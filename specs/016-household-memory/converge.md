# Convergence: Household Memory Settings

**Date**: 2026-10-01
**Branch**: `devin/1790823174-household-memory`
**Based on**: Part A commit `5f2c5589fe802ea0263e7d9e8dea198dd94b5b22`
**Contract source**: API feature 018 commit `0a5114160468f4fdc51937c615441eebb0a6f263`

## Delivered

- Synced the API 018 OpenAPI snapshot and regenerated the Web schema.
- Added household-scoped BFF routes for memory profile, memory mutations, and diner mutations.
- Added the server-loaded “Memoria del hogar” settings page, household/diner cards, memory and diner forms, and desktop/mobile navigation.
- Added confirmation, optimistic-version, idempotency, validation, permission, conflict, gone-record, pending, and accessible status behavior.
- Added component, unit, accessibility, contract, BFF, and gated authenticated browser tests.
- Added the fixture-only `/dev-preview/memory` page. No `src/app/dev-preview/` file is part of the feature changes.

## Requirement-to-test coverage

| Requirement / scenario | Coverage |
|---|---|
| Household/diner ownership, labels, kind order, restriction emphasis, linked account, empty state | `tests/unit/memory/grouping.test.ts`, `tests/component/memory/MemoryProfile.test.tsx`, `tests/accessibility/memory.a11y.test.tsx` |
| Memory create idempotency, 1000-character limit/counter, edit version, forget confirmation | `tests/component/memory/MemoryCard.test.tsx` |
| Diner name limit, available member linking, create idempotency, rename version, archive confirmation/copy | `tests/unit/memory/grouping.test.ts`, `tests/component/memory/DinerCard.test.tsx` |
| BFF household profile reads, request forwarding, idempotency/version payloads, problem statuses, empty 204s | `tests/unit/memory-routes.test.ts` |
| Loading/pending, permission, validation, 409 conflict, 404 gone, accessible announcements and focus | Memory component/accessibility tests; `tests/accessibility/shell.a11y.test.tsx` covers named navigation landmarks and the skip link |
| Authenticated add/forget journey and responsive overflow | `e2e/memory.spec.ts`, gated by `RUN_MEMORY_E2E=1` and a local authenticated stack |
| Memory-content logging | Source audit of memory page, BFF routes, and components found no console/logger calls |

## Verification

| Check | Result |
|---|---|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 220 tests across 45 files |
| `pnpm api:check` | PASS |
| `pnpm build` | PASS |
| `git diff --check` and `git diff --cached --check` | PASS |
| `pnpm test:a11y` | PASS — 1 Playwright axe test |
| Responsive preview | PASS — no horizontal overflow at 375, 768, 1024, or 1440px |
| Keyboard focus / touch targets | PASS — first focused action has a visible 3px outline; visible buttons measured at 44px |
| Reduced motion | PASS — reduced-motion media query applied; transition and animation durations measured at 0.01ms |
| `pnpm licenses:check` | PASS — 14 license families |
| `pnpm performance:check` | PASS — 1,005,768 / 2,000,000 byte client-chunk budget |
| Web Vitals sample | PASS — local auth-shell navigation: DOMContentLoaded 44.9ms, FCP 68ms |

## Environment-dependent or unresolved checks

- `pnpm test:e2e`: 7 passed, 13 skipped, 1 failed. The feature’s `e2e/memory.spec.ts` was skipped as designed because `RUN_MEMORY_E2E=1` and an authenticated local stack were not enabled. The failure was the unrelated existing unauthenticated `/plan` redirect test: a fresh browser’s `GET /api/auth/session` returned 500 with no cookies; the proxy maps a non-OK session response to 503, so the expected login redirect could not occur. The auth proxy, protected layout, and failing test are unchanged from `origin/main`. No product fix was made.
- Docker Compose health was not started: `compose.yml` contains only a `web` service binding host port 3000, which conflicts with the user-requested `pnpm dev` process that must remain running. `docker compose ps` showed no running Compose containers.
- `pnpm audit --audit-level=high` reported 10 findings (1 critical, 6 high, 3 moderate), including Next.js 16.3.3 below the 16.3.6 fix and vulnerable transitive `brace-expansion` ranges. `package.json` and `pnpm-lock.yaml` are unchanged from `origin/main`; no dependency changes were made for this feature.
- The development server’s React `eval()` CSP warning also appears on the pre-existing `/dev-preview/plan` page. The screenshots remove only the Next.js development portal from the browser DOM; no app/CSP change was made.
- No authenticated rendered review of the settings route was available. The public fixture was checked for overflow at all four widths and visually inspected at 375px and 1440px.

## Screenshots and preview

- 375px: `/home/ubuntu/work/memory-375.png`
- 1440px: `/home/ubuntu/work/memory-1440.png`
- Preview URL: `http://localhost:3000/dev-preview/memory`

The existing `pnpm dev` server remains running on port 3000. The preview fixture remains uncommitted.

# Convergence: Household Memory Settings

**Date**: 2026-10-01
**Branch**: `devin/1790823174-household-memory`
**Based on**: Part A commit `5f2c5589fe802ea0263e7d9e8dea198dd94b5b22`
**Contract source**: API feature 018 commit `ef792f4909e0960133441b13308aa3ee699b87b6`

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

## Review follow-up

**Date**: 2026-10-02
**Branch**: `devin/1790823174-household-memory`
**Base**: local merge of Web PR #152, `9bf274b1923825b98c89828aad5597d8e5778a50`

- The member loader now requests `limit=100`, the API-supported maximum. No cursor loop or loader test was added because the pinned API endpoint has no cursor parameter and the private Server Component loader is not directly testable without extracting unrelated infrastructure.
- Archive success is announced from a persistent profile-owned status region, with `DinerCard` notifying `MemoryProfile` before `router.refresh()`.
- Diner BFF routes preserve upstream `code` and structured `detail`; add and rename forms distinguish `invalid_member_link`, duplicate/display-name validation, and global-only errors.
- The gated browser journey now creates a diner, adds a restriction and a like, asserts their order, and archives the diner.

### Verification

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed: 228 tests across 45 files. The first run exposed a duplicate-text assertion in the new rename regression; the assertion was narrowed to the global status region and the full suite was rerun successfully.
- `pnpm build` — passed with all 25 static pages generated.
- `git diff --check` — passed.
- `pnpm api:check` was not run: the API C OpenAPI file and the Web contract snapshot were byte-for-byte identical, so no generated contract synchronization was needed.
- The gated `RUN_MEMORY_E2E=1` browser test was not run because no authenticated local stack was available; no full Compose, ZITADEL, or Mailpit services were started.

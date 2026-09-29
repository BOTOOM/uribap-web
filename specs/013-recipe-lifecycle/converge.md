# Convergence: Recipe Lifecycle Web Controls

**Date**: 2026-09-29
**Result**: Implemented and locally verified; branch push completes delivery.

## Requirement evidence

- Metadata edits use PATCH, while servings/preparation changes use recipe revisions; component tests cover metadata-only, draft, published, combined, and error cases.
- Archive confirmation and restore use their dedicated endpoints; tests cover both actions and the new-version revisions request.
- BFF routes expose PATCH, revisions, archive, and unarchive. The detail and list pages handle archived state, read-only ingredients, and the archived collection filter.
- API schema metadata is pinned to `acc8c684e930ac62dee26fe0ce053e317f1d1a52` / `v11`; the generated schema is reproducible.

## Verification

- `pnpm install --frozen-lockfile` — passed before implementation; dependencies did not change.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — 34 files passed; 155 tests passed.
- `pnpm api:check` — passed after the generated API client was staged as the expected contract update.
- `pnpm build` — passed; all application routes, including the four new BFF routes, compiled.
- `pnpm audit --audit-level=high` — no known vulnerabilities.
- `pnpm licenses:check` — passed for 14 license families.
- `pnpm performance:check` — 952,774 / 2,000,000 bytes.

## Follow-up scope change

The later handoff removed Docker/E2E execution and authenticated local-environment setup from scope. Before that instruction arrived, Docker and E2E checks had already completed: both E2E runs reported 8 passed and 11 skipped, and the local Web Docker health endpoint returned 200. The Web Compose container was stopped and the generated `.env.local` was removed. The pre-existing API PostgreSQL container remains healthy. No ZITADEL stack or authenticated visual-review environment was started or left running.

The contract compatibility workflow against API `main` was not run; its mismatch is expected until API PR #149 merges.

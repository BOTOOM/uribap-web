# Quickstart: Household Memory Settings

## Prerequisites

- Use the Web repository on `devin/1790823174-household-memory`.
- The API 018 OpenAPI snapshot is pinned from API commit `ef792f4909e0960133441b13308aa3ee699b87b6`.
- Use the existing authenticated local stack for gated E2E only; the uncommitted preview uses fixture data.

## Validate

1. Run focused memory component, unit, BFF-route, and accessibility tests.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm api:check`, and `pnpm build`.
3. Start or reuse `pnpm dev` on port 3000 and visit `/dev-preview/memory`.
4. Verify the preview at 375px, 768px, 1024px, and 1440px, including no horizontal overflow; capture:
   - `/home/ubuntu/work/memory-375.png`
   - `/home/ubuntu/work/memory-1440.png`
5. The authenticated `e2e/memory.spec.ts` is opt-in and remains skipped unless `RUN_MEMORY_E2E=1` and the local authenticated stack are available.

Expected outcomes: profile data is grouped by owner and kind; creates include an idempotency key; edits include `expected_version`; validation, permission, conflict, and gone-record states remain visible; successful and stale mutations refresh server state.

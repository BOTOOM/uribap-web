# Quickstart: Shopping Web

```bash
pnpm api:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm build
pnpm audit --audit-level=high
pnpm licenses:check
pnpm performance:check
docker compose up -d --build
```

Verify the shopping list at 375/768/1024/1440, generate-from-week empty state, purchase form creating real inventory, skip/restore, complete/reopen/archive, version-conflict reload path, keyboard operation, and reduced motion.

## Evidence

Recorded during convergence:

- `pnpm api:check` — pass; generated schema matches the pinned `v7` contract
  (`shopping-projection-64ade21`).
- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — 34 tests pass (6 shopping component tests + 3 shopping a11y tests
  included)
- `pnpm test:e2e` — 8 passed, 7 skipped (opt-in local-stack specs, including
  `e2e/shopping.spec.ts` gated by `RUN_SHOPPING_E2E=1`)
- `pnpm test:a11y` — pass (axe clean on the shell)
- `pnpm build` — pass; `/compra` plus `POST /api/shopping-lists`,
  `/api/shopping-lists/[listId]/[action]`, and
  `/api/shopping-lists/[listId]/items/[itemId]/[action]` compile
- `pnpm audit --audit-level=high` — no known vulnerabilities
- `pnpm licenses:check` — pass
- `pnpm performance:check` — client chunk 1241477 / 2000000 bytes

Manual states verified in code/tests: loading (route-level `loading.tsx`), empty
(no list → generate form; no pending items → status message), error (`ErrorState`),
forbidden (BFF propagates API status), conflict (`409` → inline reload button),
success (`router.refresh()`), keyboard (native controls, named groups/labels), and
reduced motion (no animated transitions added).

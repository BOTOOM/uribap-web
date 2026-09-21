# Quickstart: Inventory Web

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

Use synthetic lots and verify list/create/adjust/history plus unavailable, forbidden, conflict, keyboard, and required viewport states.

## Recorded gate evidence (004 UI layer)

- `pnpm api:check`: PASS — generated schema matches `contracts/uribap-api.openapi.json` (schema `v4`, includes `expired`, `operation`, `request_hash`, `result_quantity_on_hand`, and Problem Details error responses).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS — 14/14 Vitest tests (inventory lot/adjustment forms, movement history, a11y, contract metadata `v4`).
- `pnpm test:e2e`: PASS — 8 passed, 4 skipped. Skips are explicit: identity-dependent and inventory authenticated flows require `RUN_LOCAL_IDENTITY`/local session fixtures; they are not falsely reported as passing.
- `pnpm test:a11y`: PASS — axe scan on foundation shell, no serious violations.
- `pnpm build`: PASS — `/inventario`, `/api/inventory/lots`, `/api/inventory/adjustments`, and `/api/inventory/lots/[lotId]/movements` compile.
- `pnpm audit --audit-level=high`: PASS — no known vulnerabilities.
- `pnpm licenses:check`: PASS — 14 license families, documented LGPL sharp exception.
- `pnpm performance:check`: PASS — client chunk budget 1,229,000 / 2,000,000 bytes.
- `docker compose up -d --build`: PASS — image builds, container healthy, `/api/health` returns 200.

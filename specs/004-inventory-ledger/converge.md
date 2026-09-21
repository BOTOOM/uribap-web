# Convergence: Inventory Web

**Status**: Implementation and local delivery gates complete. Email delivery and deployment remain out of scope.

## Implemented

- Generated API v4 contract with Problem Details and expiry/replay fields.
- Server-authoritative `/inventario` list including expired/unavailable state (`include_expired=true`, API-provided `expired` flag; no client-side expiry math).
- Server-only BFF routes for lot creation, adjustments, and movement history.
- Stable idempotency key across uncertain adjustment retries; key rotates only after confirmed success or a new logical operation.
- Router refresh after successful mutations.
- Generated schema types used for lot/adjustment/movement payloads and DTOs.
- Component, accessibility, and conditional E2E coverage.

## Evidence

- `pnpm api:check`: PASS — generated schema matches contract snapshot (`v4`).
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS — 14/14 Vitest tests.
- `pnpm test:e2e`: PASS — 8 passed, 4 skipped (explicit skips for identity/authenticated inventory flows without local session fixtures; no false pass claimed).
- `pnpm test:a11y`: PASS — axe scan, no serious violations.
- `pnpm build`: PASS — `/inventario` and all `/api/inventory/*` BFF routes compile.
- `pnpm audit --audit-level=high`: PASS — no known vulnerabilities.
- `pnpm licenses:check`: PASS.
- `pnpm performance:check`: PASS — client budget 1,229,000 / 2,000,000 bytes.
- `docker compose up -d --build`: PASS — container healthy, `/api/health` 200.

## Remaining work

- None blocking for this phase. Authenticated inventory E2E stays opt-in (`RUN_INVENTORY_E2E=1`) until a reusable local session fixture exists; unit/component coverage plus the identity E2E suite cover the boundary meanwhile.
- Email delivery and deployment remain out of scope.

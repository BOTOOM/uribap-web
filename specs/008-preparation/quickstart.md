# Quickstart: Preparation Web

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

Verify the task list at 375/768/1024/1440, empty state without tasks, derived-task
origin labels, overdue marking, complete/cancel with `expected_version`, manual-task
creation, version-conflict reload path, keyboard operation, and reduced motion.

## Evidence

Validated 2026-10-05:

- `api:check`: generated schema clean against pinned `v8` contract.
- `lint` + `typecheck`: clean (overdue flags computed outside render per
  `react-hooks/purity`).
- `pnpm test`: 44 passed across 17 files, including
  `tests/component/preparation/preparation.test.tsx` (7: transitions send
  `expected_version` + `Idempotency-Key`, 409 reload affordance, manual form
  payloads) and `tests/accessibility/preparation.a11y.test.tsx` (3: label
  association, named form, no controls on resolved tasks).
- `pnpm test:e2e e2e/preparation.spec.ts`: opt-in spec registered, skipped without
  `RUN_PREPARATION_E2E=1` like the rest of the suite.
- `pnpm build`: `/preparacion` and `/api/preparation-tasks/*` compiled.
- `pnpm licenses:check`, `pnpm performance:check`: passed.

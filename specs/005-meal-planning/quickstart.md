# Quickstart: Meal Planning Web

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

Verify the week plan at 375/768/1024/1440, entry add/edit/remove while draft, propose/approve/reopen/archive actions, self-approval rejection, version-conflict reload path, keyboard operation, and reduced motion.

## Evidence (2026-09-21)

- `pnpm api:check`: PASS — generated schema matches the API 005 snapshot including `published-versions` and `recipe_version_id` updates.
- `pnpm lint`, `pnpm typecheck`: PASS.
- `pnpm test`: 18 Vitest cases pass (planning components, states, a11y unit).
- `pnpm test:e2e`: 8 passed, 5 explicitly skipped pending a reusable authenticated local session (same opt-in posture as phase 004).
- `pnpm build`: PASS — `/plan` and the `/api/plans/**` BFF handlers compile.
- `pnpm audit --audit-level=high`: no known vulnerabilities.
- `pnpm licenses:check`: PASS.
- `pnpm performance:check`: 1,235,328 / 2,000,000 bytes.

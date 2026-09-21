# Quickstart: Meal Completion Web

```bash
pnpm api:check
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm build
```

Manual flow:

1. Approve a plan, open `/plan`, click "Completar" on an entry → completion card
   appears with planned vs actual lines.
2. Edit a line actual via "Corregir" → updated amount renders.
3. Click "Reabrir" → completion marked `reopened`, entry completable again.
4. Force a stale `expected_version` (two tabs) → conflict banner with reload.

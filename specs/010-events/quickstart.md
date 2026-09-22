# Quickstart: Household Activity Web

```bash
pnpm api:check
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm build
```

Manual flow:

1. Trigger household activity (invite, approve a plan, complete a meal), open
   `/settings/household` → `Actividad` lists the newest events with labels and
   timestamps.
2. `Cargar más` appends the next page until `has_more` is false.
3. With an invitation pending, the outbox summary shows `suprimido` counts
   after the API dispatcher runs, with the "envío deshabilitado" hint.

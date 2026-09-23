# Quickstart: Product UI Redesign (Mesa)

## Local stack

1. Identity: `docker compose -f api/identity/compose.identity.yml up -d`
   (ZITADEL :8080, Mailpit :8025).
2. API: `docker compose -f api/compose.yml up -d` (migrations on boot).
3. Web: `pnpm install && pnpm build && pnpm start` (`:3000`).
4. Demo login: register at the ZITADEL login screen (email
   `demo@uribap.local`), verification mail lands in Mailpit.

## Verify

- `pnpm api:check lint typecheck test build test:e2e test:a11y
  performance:check licenses:check`
- Browser journeys per `docs/journeys/*.feature` at
  375/768/1024/1440 px, keyboard-only pass, reduced-motion emulation.

# Quickstart — ZITADEL Household Invitations

1. The API feature branch is pushed at
   `bed66b4de11e647a7a489a6b9f8ef08fd5e48a2c`.
2. Its OpenAPI snapshot is copied into `contracts/uribap-api.openapi.json`;
   `contracts/metadata.json` pins schema `v12` to that API SHA. `pnpm api:generate`
   has been run.
3. Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`,
   `pnpm test`, `pnpm api:check`, and `pnpm build`. Current results are recorded
   below and in `converge.md`.
4. Do not start Docker, ZITADEL, Mailpit, E2E, or an authenticated browser.

## Local verification results

- `pnpm install --frozen-lockfile` — passed.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed, 169 tests across 37 files.
- `pnpm api:check` — passed after staging the regenerated client; no unstaged
  generated-code drift remained.
- `pnpm build` — passed, including the by-ID acceptance BFF route.
- `git diff --check` and `git diff --cached --check` — passed.

The install reported that pnpm ignored the `unrs-resolver@1.12.2` build script.
No build-script approval was added; typecheck, tests, API check, and build passed
with the existing environment.

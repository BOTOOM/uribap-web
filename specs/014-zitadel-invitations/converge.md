# Convergence — ZITADEL Household Invitations

## Scope

Consume the API's ZITADEL invitation outcomes and by-ID acceptance contract, preserve
invitation tokens during login, and let signed-in users accept pending invitations
during onboarding.

## Verification record

- `pnpm install --frozen-lockfile` — passed. pnpm reported the blocked
  `unrs-resolver@1.12.2` build script; no approval was added.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed: 169 tests in 37 files.
- `pnpm api:check` — passed after staging the regenerated schema; the check found
  no unstaged generated-code drift.
- `pnpm build` — passed; output includes
  `/api/me/invitations/[invitationId]/accept`.
- `git diff --check` and `git diff --cached --check` — passed, covering both the
  unstaged changes and the staged generated client.

## Browser and identity-provider validation

No authenticated-browser or live ZITADEL check will be run. Docker, ZITADEL, Mailpit,
and E2E testing are outside the requested verification scope.

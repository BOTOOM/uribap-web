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

## Review follow-up

- Household settings now fetches `/me/invitations`, displays `PendingInvitations` only
  when items are returned, and treats load failures as an empty list.
- Expiry dates use `<time dateTime>` and render in UTC for SSR and the initial client
  render, switching to the browser-local time zone after the hydration effect.
- Invitation tokens are handed off through the HttpOnly `uribap_invitation_token`
  cookie. The public hold route returns a 303 to the token-free login return target,
  sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store`, and clears the
  cookie after successful acceptance or API 404/410 responses. The proxy allows this
  handoff route without requiring a session.
- No metadata-generation script exists in this repository. `pnpm api:generate`
  generates only the TypeScript client, so `contracts/metadata.json` and its pinned
  test were updated to `2026-10-01`; `apiRevision` and `schemaVersion` were preserved.

## Review follow-up verification

- Focused route, settings-page, formatter, proxy, return-target, component, and
  security-header tests passed: 48 tests across 11 files. After the hydration lint
  adjustment, the invitation component tests passed again: 3 tests.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed: 184 tests across 41 files.
- `pnpm api:check` — passed; generated client matched the pinned OpenAPI snapshot.
- `pnpm build` — passed; Next.js 16.3.3 included `/api/invitations/hold`.
- Authenticated-browser/E2E, Docker, ZITADEL, Mailpit, and visual checks were not run.
  This follows the review brief's explicit limits; the changed UI is visually
  unverified. Dependency audit remediation remains separate in PR #154 and was not
  folded into this branch.

# Quickstart: Household Invitation Management

## Prerequisites

- Use the Web feature branch `devin/1791942362-invitation-management`.
- The invitation-management API contract is available at revision
  `c0386230a7b04176e86eaa0984b99a4d90c327e5` (API PR
  [BOTOOM/uribap-api#160](https://github.com/BOTOOM/uribap-api/pull/160), unmerged; the API must
  deploy before this Web change goes live).
- The Web dependency installation is available through pnpm.

## Contract Setup

1. Copy the API revision's `openapi/openapi.json` to `contracts/uribap-api.openapi.json`.
2. Update contract metadata to API revision `c0386230a7b04176e86eaa0984b99a4d90c327e5`, schema
   `v17`, and date `2026-10-14`.
3. Run `pnpm api:generate` and update the contract metadata unit assertions.
4. Confirm the generated `InvitationResponse` exposes `effective_status` and `delivery`.

## Focused Validation

```bash
pnpm exec vitest run --config vitest.config.mts tests/component/household/InvitationManagement.test.tsx tests/unit/api-contract.test.ts
pnpm lint
pnpm typecheck
pnpm api:check
pnpm test
pnpm build
```

Expected panel behavior:

- A household with invitations in all four effective statuses lists each with email, role, Spanish
  status badge, delivery outcome, and expiry date.
- `Reenviar` appears only on `expired` or `failed`-delivery rows and refreshes the list after the
  create call succeeds.
- `Revocar` appears only on `pending` rows and refreshes the list after the delete succeeds.
- A member-role viewer never receives the panel; a listing failure shows the panel's error state
  without breaking the settings page.

## Feature Verification

Invoke `/uribap-web-testing` and record each executed/skipped gate in `converge.md`. Compare the
final contract snapshot byte-for-byte with the pinned API branch's `openapi/openapi.json`; run
`git diff --check` before commit and push.

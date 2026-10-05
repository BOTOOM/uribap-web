# Implementation Plan: ZITADEL Household Invitations

**Branch**: `014-zitadel-invitations` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

## Summary

Use the API's ZITADEL delivery outcomes and verified-email pending-invitation contract.
Preserve invitation tokens through login, expose by-ID acceptance through the
authenticated BFF, and render pending invitations in onboarding while keeping API
business rules authoritative.

## Constraints

Next.js 16 App Router, generated OpenAPI types, server-only authenticated BFF, server
components for onboarding data, small client leaves for invitation form/acceptance,
existing Spanish labels and visual language, and API-authoritative acceptance. Do not
run an authenticated browser, ZITADEL, Mailpit, Docker, or E2E validation.

## Model Assignment

Primary `gpt-5-6-luna-high`, implementation `gpt-5-6-sol-high`, reviewer
`gpt-5-6-terra-high`, long-context analysis `glm-5-3-max`, bounded fixes `swe-2-high`.

Model IDs follow the Web `AGENTS.md` matrix; `devin models list` is unavailable in this
environment.

## Structure

```text
contracts/uribap-api.openapi.json
contracts/metadata.json
src/lib/api/generated/schema.ts
src/app/(public)/invitations/accept/page.tsx
src/app/api/me/invitations/[invitationId]/accept/route.ts
src/app/(public)/onboarding/page.tsx
src/components/household/InvitationForm.tsx
src/components/household/InvitationAcceptanceForm.tsx
src/components/household/PendingInvitations.tsx
src/app/(app)/settings/household/page.tsx
tests/unit/auth/
tests/component/household/
```

## API Contract Sequence

After the API branch is pushed, copy its OpenAPI snapshot, run `pnpm api:generate`, and
set `contracts/metadata.json` to the exact API commit SHA, schema version `v12`, and
the current date. Update the contract metadata test. Use generated response types for
invitation delivery and pending invitations.

## UI and BFF Design

- Move the token query into a flow-scoped HttpOnly cookie through
  `/api/invitations/hold` before checking authentication. The hold route redirects to
  `/invitations/accept?flow=<uuid>`; login `returnTo` carries only that flow URL, never
  the token. Reuse `safeReturnTo`, which retains pathname, search, and fragment.
- Add an optional invitee name field; send it only when non-empty. Use the four exact
  delivery messages in the feature specification and remove Mailpit-specific copy.
- Fetch `/me/invitations` server-side during onboarding. If this fetch fails, treat it
  as empty without weakening the existing `/me` membership handling.
- Render a client `PendingInvitations` leaf only when items exist. Show household,
  localized role, and expiry. Use the BFF acceptance route; navigate to `/plan` and
  refresh on success, and show an accessible error on failure.
- Keep the existing household-creation form below an invitation/create-own-home
  divider. Replace remaining Mailpit wording with neutral invitation-email text.

## Verification

Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm api:check`, `pnpm build`, and `git diff --check`. Do not run Docker, ZITADEL,
Mailpit, E2E, or authenticated-browser checks. Record the absence of authenticated
browser/ZITADEL validation in `converge.md`.

## Constitution Check

- API authority: only the API decides delivery, verified-email eligibility, and
  invitation acceptance.
- Server/client boundary: fetch pending invitations in the server page and keep
  mutation state in a focused client leaf.
- Accessibility: render loading/pending and error states with existing form/status
  patterns and native buttons.
- Contract: regenerate types from the API snapshot pinned to the pushed API revision.
- Security: preserve only a validated internal return path and keep session-bearing
  BFF calls server-side.

## Quickstart

1. Copy the pushed API OpenAPI snapshot into `contracts/uribap-api.openapi.json`.
2. Run `pnpm api:generate` and update the contract metadata to the pushed API SHA and
   `v12`.
3. Run the focused invitation component/unit tests, then the verification commands
   listed above.
4. Do not start an identity stack or authenticated browser. Record those checks as
   intentionally not run in convergence.

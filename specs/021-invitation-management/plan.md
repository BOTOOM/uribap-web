# Implementation Plan: Household Invitation Management

**Branch**: `devin/1791942362-invitation-management` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: [Feature specification](./spec.md)

## Summary

Pin the Web client to the API invitation-management revision
`c0386230a7b04176e86eaa0984b99a4d90c327e5` (API pull request
[BOTOOM/uribap-api#160](https://github.com/BOTOOM/uribap-api/pull/160), branch
`devin/1791942026-invitation-management`), regenerate the OpenAPI-derived types, add a BFF `GET`
proxy for the household invitation listing and a `DELETE` proxy for revoke, and add an
`InvitationManagement` client panel on the household settings page that lists every invitation
with its effective status and delivery outcome and offers resend/revoke actions where the API
semantics allow them.

The pinned API revision is **not yet merged** into the API `main`: this Web feature depends on
that API pull request deploying first, so the Web pull request stays a draft until the API change
lands.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Next.js 16.3.6.

**Primary Dependencies**: Next.js App Router route handlers, `serverApiFetch`, generated OpenAPI
types (`InvitationPage`, `InvitationResponse`), Vitest + Testing Library, pnpm.

**Storage**: No Web-owned invitation storage; FastAPI remains authoritative for invitation state,
effective status, and delivery outcome.

**Testing**: Vitest unit/component tests, Biome lint, TypeScript, OpenAPI generation check, Next.js
production build, and the `/uribap-web-testing` workflow.

**Target Platform**: Next.js server-rendered application on the repository's existing Vercel and
Docker targets.

**Project Type**: Web application.

**Performance Goals**: One invitation listing request on the settings page (only for owner/admin
roles) plus one refetch per completed resend/revoke action. The API caps the listing at 100 items
per request (`limit` default 50), which covers realistic households.

**Constraints**:

- Keep all invitation reads and mutations behind `serverApiFetch`; never expose the access token
  or call the FastAPI from the browser directly.
- Render only API-provided `effective_status` and `delivery` values; do not recompute expiry or
  delivery state in the Web layer beyond choosing which action buttons to offer.
- Reuse the existing `POST /api/households/{id}/invitations` BFF route (which proxies
  `create_invitation`) for resend instead of adding a new mutation route.
- Follow `MemberManagement.tsx` and `PendingInvitations.tsx` patterns for rows, pending, error,
  and Spanish copy; reuse `formatInvitationExpiry` for dates.
- Hide the entire panel for member-role viewers instead of rendering a permission error.
- Generate the API client from the pinned contract; do not hand-edit OpenAPI or generated schema.
- Preserve the pre-existing untracked `src/app/dev-preview/` directory without staging it.

**Scale/Scope**: Two BFF proxy additions, one new client component, one settings-page integration,
one new component test file, and the contract metadata/schema test update.

## Model Assignment

- Primary UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Reviewer: `gpt-5-6-terra-high` for server boundaries, accessibility, and responsive-state review.
- Long-context analysis: `glm-5-3-max`.
- Bounded fixes: `swe-2-high`.
- Escalation condition: stop if the pinned API does not expose `effective_status`/`delivery` on the
  invitation listing or if resend cannot reuse the create-invitation endpoint.
- Model identifiers are cited from the Web `AGENTS.md` guide per the owner decision; no
  `devin models list` verification is required or run.

## Constitution Check

*GATE: Pass before research; re-evaluate after design.*

- **API is the source of truth**: the panel renders `effective_status` and `delivery` exactly as the
  API returns them; resend and revoke call API operations and never mutate local state beyond the
  refreshed list.
- **Server-first performance**: the initial listing loads in the Server Component loader only when
  the viewer can manage the household; action refetches go through the BFF proxy.
- **Accessible task completion**: rows reuse the settings row pattern; actions are buttons with
  Spanish labels and pending states; list state changes reuse `role="status"`/`role="alert"`.
- **Contract and state coverage**: the pinned contract is regenerated and asserted by the contract
  test; loading, empty, error, and permission variants are covered.
- **Responsive behavior**: rows reuse the existing flex row/card styles that already wrap on narrow
  screens.
- **Security**: credentials stay server-side; the panel is only rendered for owner/admin roles and
  the API independently enforces role checks on every endpoint.
- **Model policy**: cite model IDs from the guide without CLI verification, as decided by the owner.

No product-design constitution gate requires an exception.

## API Contract Sequence

1. Copy `openapi/openapi.json` from API revision
   `c0386230a7b04176e86eaa0984b99a4d90c327e5` (branch
   `devin/1791942026-invitation-management`) to `contracts/uribap-api.openapi.json`.
2. Update `contracts/metadata.json` to that API revision, schema version `v17`, and generation date
   `2026-10-14`; update the pinned metadata assertions in `tests/unit/api-contract.test.ts`.
3. Run `pnpm api:generate`; the generated `InvitationResponse` must expose `effective_status`
   (`pending | expired | accepted | revoked`) and `delivery` (outbox-mapped outcome or `null`).
4. Finish with `cmp` against the exact API branch OpenAPI file. The contract is pinned to an
   **unmerged** API pull request (#160); the `cmp` target is that branch, not API `main`.

## Architecture

### BFF proxies

- Extend `src/app/api/households/[householdId]/invitations/route.ts` with `GET`, proxying
  `serverApiFetch("/households/{id}/invitations")` and returning the `InvitationPage` JSON with the
  file's existing error mapping.
- Add `src/app/api/households/[householdId]/invitations/[invitationId]/route.ts` with `DELETE`,
  following the `members/[userId]/route.ts` pattern exactly: forward the request, return `204` with
  an empty body on success, and map errors to `{ code, detail }` with their status.

### Settings page integration

- In `src/app/(app)/settings/household/page.tsx`, extend `loadHouseholdData` to also load
  `InvitationPage` from `/households/{id}/invitations` only when the active membership role is
  `owner` or `admin`; a listing failure produces a `null` list that the panel renders as its error
  state rather than failing the whole page.
- Render a new `InvitationManagement` card alongside the member panel (own full-width card between
  the members/invite grid and the activity card) and pass `initialInvitations` plus `canManage`.

### Client panel

- Add `src/components/household/InvitationManagement.tsx` as a `"use client"` component next to
  `MemberManagement.tsx`, taking `householdId`, `initialInvitations`, and `canManage`.
- Each row shows email, the Spanish role label, an effective-status badge
  (`pendiente`/`vencida`/`aceptada`/`revocada` mapped to existing `.status` classes), the delivery
  outcome (`enviada`/`fallida`/`cuenta existente`/`pendiente`/`sin enviar`), and the formatted
  expiry date via `formatInvitationExpiry`.
- `Reenviar` is offered only when `effective_status === "expired"` or `delivery === "failed"`; it
  POSTs `{ email }` to the existing invitations BFF route. When `delivery === "existing_account"`
  the resend affordance is labelled to make clear the invitee will see the invitation inside the
  app rather than by email.
- `Revocar` is offered only when `effective_status === "pending"`; it issues `DELETE` to the new
  BFF route.
- After either action resolves, the list is refetched through the BFF `GET`; action errors surface
  a `role="alert"` message and keep the previously rendered list.

### Tests

- Add `tests/component/household/InvitationManagement.test.tsx`: rendering of statuses/delivery
  labels/expiry, resend enablement rules, revoke enablement rules, action refetch, action error
  handling, and the existing-account resend label.
- Update `tests/unit/api-contract.test.ts` for the API revision, `v17` metadata, the invitation
  listing/revoke paths, and the `effective_status`/`delivery` schema fields.

## Verification Plan

Run focused tests, then the repository gates:

```bash
pnpm exec vitest run --config vitest.config.mts tests/component/household/InvitationManagement.test.tsx tests/unit/api-contract.test.ts
pnpm lint
pnpm typecheck
pnpm api:check
pnpm test
pnpm build
```

Invoke `/uribap-web-testing` before convergence and report any unavailable gate with its concrete
reason. Run `cmp` against the pinned API branch's OpenAPI file and `git diff --check`. The
`api:check` script compares the generated schema with the Git worktree, so it must run after the
generated file is staged or committed.

## Project Structure

```text
specs/021-invitation-management/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/invitation-management.md
├── checklists/requirements.md
└── tasks.md

src/app/api/households/[householdId]/invitations/route.ts
src/app/api/households/[householdId]/invitations/[invitationId]/route.ts
src/app/(app)/settings/household/page.tsx
src/components/household/InvitationManagement.tsx
tests/component/household/InvitationManagement.test.tsx
tests/unit/api-contract.test.ts
contracts/uribap-api.openapi.json
contracts/metadata.json
src/lib/api/generated/schema.ts
```

## Post-Design Constitution Check

- **API authority**: maintained; status and delivery are API-computed and actions delegate to API
  operations.
- **Server-first and security**: maintained; listing loads server-side for managers only and every
  call stays behind the authenticated BFF boundary.
- **Contract integrity**: the generated schema is tied to the pinned API invitation revision and an
  exact OpenAPI snapshot.
- **State behavior**: loading/empty/error/permission variants are explicit; failed actions preserve
  the previously rendered list.
- **Accessibility and responsive behavior**: existing row, status, and button classes are reused;
  no new interaction model is introduced.

All design gates pass; no complexity exception is required.

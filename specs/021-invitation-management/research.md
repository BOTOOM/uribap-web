# Research: Household Invitation Management

## Decisions

### Consume the API-provided effective status and delivery outcome verbatim

- **Decision**: Pin the Web contract to API revision
  `c0386230a7b04176e86eaa0984b99a4d90c327e5` (pull request
  [BOTOOM/uribap-api#160](https://github.com/BOTOOM/uribap-api/pull/160)) and render each
  invitation's `effective_status` and `delivery` exactly as returned.
- **Rationale**: The API owns the expiry comparison (`pending` past `expires_at` reports
  `expired`) and the outbox mapping (`sent`/`failed`/`suppressed→existing_account`/`pending`,
  absent outbox → `null`). Recomputing either in the Web layer would duplicate domain logic and
  drift whenever the API refines it.
- **Alternatives considered**: Deriving expiry in the browser from `expires_at` was rejected; the
  browser clock and the API's `now` can disagree, and the API already reports the answer.

### Proxy the listing and revoke through the established BFF pattern

- **Decision**: Add `GET` to the existing invitations route file and a sibling
  `[invitationId]/route.ts` with `DELETE`, copying the `members/[userId]/route.ts` handler shape.
- **Rationale**: Every household mutation already flows through `serverApiFetch` with the same
  error mapping to `{ code, detail }`; a new pattern would split the session boundary.
- **Alternatives considered**: Fetching the listing in the browser directly against FastAPI was
  rejected — it would expose the access token and break the BFF boundary.

### Reuse the create-invitation endpoint for resend

- **Decision**: Resend POSTs `{ email }` to the existing invitations BFF route.
- **Rationale**: The API's create-invitation path already renews an expired pending invitation for
  the same email and returns the new delivery outcome; a dedicated resend route would re-expose the
  same operation under a second name.
- **Alternatives considered**: A `resend` sub-route was rejected because the API exposes no such
  endpoint and the renewal semantics live inside `create_invitation`.

### Load the listing server-side only for managers, then refetch client-side after actions

- **Decision**: The settings page loader requests the invitation listing only when the active
  membership role is `owner` or `admin`; after resend/revoke the client panel refetches through the
  BFF `GET`.
- **Rationale**: Members cannot call the endpoint (the API enforces the same check), so skipping
  the request avoids a guaranteed 403 and keeps the panel hidden entirely for non-managers. Passing
  the first page as props mirrors `MemberManagement`'s `initialMembers` pattern.
- **Alternatives considered**: Always fetching and hiding on error would issue a doomed request for
  every member; a client-only listing would add an avoidable loading flash on first render.

## Repository Findings

- `src/app/api/households/[householdId]/invitations/route.ts` currently only proxies `POST` create;
  `members/[userId]/route.ts` shows the shared `PATCH`/`DELETE` handler pattern with `If-Match`
  forwarding.
- `MemberManagement.tsx` takes `initialMembers` from the server loader and mutates through
  `/api/households/{id}/members/{userId}`; `PendingInvitations.tsx` shows the hydrated-date and
  action-error patterns reused here.
- `formatInvitationExpiry` formats expiry dates in Spanish, with a `UTC` fallback used before
  hydration to avoid server/client markup drift.
- `pnpm api:generate` runs `openapi-typescript` against `contracts/uribap-api.openapi.json`;
  `pnpm api:check` regenerates and checks for generated-schema drift against the Git worktree.
- The pinned API revision is unmerged (API PR #160); this Web feature is pinned to the API feature
  branch and must deploy after it.

## Unresolved Research

None. The listing shape, delivery mapping, resend semantics, and revoke endpoint are specified by
the API pull request and the feature request.

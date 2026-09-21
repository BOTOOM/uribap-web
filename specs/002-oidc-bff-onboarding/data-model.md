# Data Model: OIDC BFF and Household Onboarding

**Feature**: `002-oidc-bff-onboarding`

The Web does not own identity or household persistence. These shapes describe server/session/UI boundaries and reference the API model in `../api/specs/002-identity-households/data-model.md`.

## Server session shape

### Private server token shape

Stored only inside Auth.js's encrypted server-side session boundary:

- Provider issuer and subject reference.
- Provider access token and refresh token, only if required for server-side API calls.
- Token expiry and refresh metadata.
- Internal user ID after API provisioning.
- No raw invitation token or password.

This shape is never returned by the public session callback or serialized into client props.

### Public browser session shape

Safe fields only:

- `user.id`: internal Uribap user ID.
- `user.name`: display name.
- `user.email`: normalized email when available.
- `user.emailVerified`: boolean.
- `memberships`: `{ householdId, householdName, role, status }[]`.
- `activeHouseholdId`: selected authorized household ID, validated server-side.

## Auth transaction

Short-lived server boundary values:

- `state`: callback correlation.
- `nonce`: replay protection.
- `codeVerifier`: PKCE verifier.
- `returnTo`: allowlisted relative route only.

Auth.js manages the protocol values. The Web must not expose or log them.

## Active household context

- `householdId`: UUID selected from the authenticated API memberships.
- `role`: API-authoritative role summary.
- `version`: optional membership/settings version for mutation concurrency.
- `selectedAt`: server-side timestamp.

The context is not authorization by itself; every API request remains authenticated and authorized by the API.

## Onboarding draft

Client form state only:

- `name`: 1–120 trimmed characters, no control characters.
- `locale`: supported locale string.
- `timezone`: IANA timezone value.
- `submissionState`: idle/loading/validation-error/conflict/unavailable/success.

The draft is discarded after successful API creation or explicit logout and is never used as authoritative household data.

## Invitation UI model

Safe fields from API:

- `id`, `email`, `requestedRole`, `status`, `expiresAt`, `invitedBy`, `createdAt`.

Never rendered or stored in browser state:

- raw invitation token,
- authorization header,
- provider access/refresh token,
- client secret.

## Permission state model

```text
unauthenticated → redirect/sign-in
loading → progress state
authenticated/no-membership → onboarding
authenticated/membership → protected shell
forbidden → explanation + safe back/selection action
unavailable → retry + status-safe message
stale/conflict → reload/reconcile action
success → API-authoritative state
empty → first-action guidance
```

## Data ownership rules

- API/PostgreSQL owns all persistent entities and role decisions.
- Auth.js owns the Web session protocol boundary.
- React client state owns only transient form/interaction state.
- No Web data model may reimplement household authorization, invitation validity, or tenant filtering.

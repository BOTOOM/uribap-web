# OIDC BFF and Household Onboarding Contract

## Public routes

### `GET /login`

- Shows a semantic sign-in action.
- Does not render private household data.
- Preserves only an allowlisted relative `returnTo` route.

### `GET /auth-error`

- Shows safe callback/provider failure state.
- Does not expose OAuth codes, state, nonce, PKCE verifier, provider response, or stack traces.
- Offers retry/sign-in and safe navigation.

### `GET /onboarding`

Requires a valid Web session. If the user already has a membership, redirect to active household/application context.

- Form fields: `name`, `locale`, `timezone`.
- Validation: client feedback for ergonomics; API remains authoritative.
- Submit: server action/route handler with server-only API bearer injection.
- States: loading, validation error, conflict, unavailable, success.

### `GET /settings/household`

Requires a valid session and active household. Owner/admin controls are rendered from API permission state; member users receive a forbidden/read-only state.

### `GET /invitations/accept`

Requires a valid session and renders the invitation acceptance form. The raw invitation token is never placed into public session, localStorage, logs, or rendered page props.

### `POST /api/invitations/accept`

A server-only BFF route receives the form submission, calls the API's `POST /api/v1/invitations/accept` with the raw token, and returns only the safe accepted membership/result state. The API decides validity and membership.

### `GET /api/health`

Returns a minimal public Web process health response for Docker/local stack readiness. It contains no session, provider, or environment details.

## Auth.js route boundary

### `GET|POST /api/auth/[...nextauth]`

- Provider: ZITADEL discovery/issuer from server environment.
- Flow: authorization code + PKCE.
- Callback: validate state/nonce/code verifier through Auth.js and provision/refresh API identity server-side.
- Public session callback: safe fields only.
- Logout: clear local session and invoke provider end-session when configured.

## Server API client contract

`src/lib/api/server-client.ts` exposes server-only operations:

- `getCurrentUser()`
- `createHousehold(input)`
- `getHousehold(id)`
- `updateHousehold(id, input, version)`
- `listMembers(id)`
- `updateMember(id, userId, input, version)`
- `createInvitation(id, input)`
- `acceptInvitation(token)`

Rules:

- Every function requires/derives the server session.
- Every bearer header is built inside server-only code.
- Problem Details are mapped to typed states without copying secrets.
- `401` triggers safe reauthentication; `403` renders forbidden; `409` renders stale/conflict; `503` renders unavailable.

## Browser security contract

- `document.cookie` contains no readable access/refresh token, authorization code, client secret, or raw invitation token.
- `localStorage` and `sessionStorage` contain no provider token or session secret.
- Client component props contain only the public browser session shape and safe API DTOs.
- Network calls from client components do not include a bearer token.

## Environment contract

Server-only:

- `AUTH_SECRET`
- `AUTH_ZITADEL_ID`
- `AUTH_ZITADEL_SECRET` when required by the selected PKCE client configuration
- `AUTH_ZITADEL_ISSUER`
- `AUTH_TRUST_HOST` for local/approved deployment behavior
- `URIBAP_API_INTERNAL_URL`

Public:

- `NEXT_PUBLIC_API_BASE_URL` only when needed for non-private health/foundation calls.

Local values point to the disposable ZITADEL/API stack. No Brevo values are accepted in local env validation.

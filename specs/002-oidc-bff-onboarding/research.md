# Research: OIDC BFF and Household Onboarding

**Feature**: `002-oidc-bff-onboarding`

**Date**: 2026-09-10

## Decision 1: Auth.js provider boundary

- **Decision**: Use Auth.js/next-auth's built-in ZITADEL provider with authorization-code + PKCE, server-side callbacks, and the App Router auth route handler. Select the compatible maintained package release during dependency installation and record the exact lockfile version.
- **Rationale**: Auth.js documents a first-party ZITADEL provider, discovery configuration, local callback URI, and standard OIDC behavior. This avoids hand-rolling state, nonce, PKCE, callback, and logout logic.
- **Alternatives considered**: A custom OAuth implementation was rejected due to security and maintenance risk; storing provider tokens in a client state library was rejected by the Web constitution; direct browser-to-API bearer flow was rejected because it weakens the BFF boundary.
- **Sources**: [Auth.js ZITADEL provider](https://authjs.dev/getting-started/providers/zitadel), [Auth.js provider reference](https://authjs.dev/reference/core/providers/zitadel), [ZITADEL Next.js example](https://zitadel.com/docs/sdk-examples/nextjs).

## Decision 2: Server session shape

- **Decision**: Keep provider access/refresh material only in Auth.js's encrypted server-side session token/cookie and return a minimal browser session: internal user ID, display name, verified email flag, memberships summary, and active household ID. Never copy `access_token`, `refresh_token`, `id_token`, client secret, or raw invitation token into the public session object.
- **Rationale**: HttpOnly encrypted cookies prevent client JavaScript access while allowing server components/route handlers to call the API. The API remains the authorization source.
- **Alternatives considered**: Database sessions require an additional session store and were deferred; exposing a token through `useSession()` was rejected; localStorage was explicitly prohibited.

## Decision 3: Route protection and active household

- **Decision**: Use middleware or an equivalent Next.js route boundary for fast unauthenticated redirects, then repeat server-side session and membership checks in layouts/route handlers. Redirect users without a membership to onboarding and users with multiple memberships to an active-household selection state.
- **Rationale**: Middleware improves UX but cannot replace API authorization. Re-checking on the server prevents stale client state from exposing private data.
- **Alternatives considered**: Client-only route guards were rejected because private content could be rendered briefly and because security cannot depend on JavaScript.

## Decision 4: Server-only API client

- **Decision**: Add `src/lib/api/server-client.ts` that reads Auth.js server session, refreshes/reauthenticates according to the documented boundary, injects `Authorization` server-side, and maps API Problem Details to typed UI state. Client components call server actions/route handlers and never receive bearer tokens.
- **Rationale**: This preserves the Web/API boundary and lets API contract changes remain generated and reviewable.
- **Alternatives considered**: A browser-side `openapi-fetch` client with bearer tokens was rejected; duplicating API permission logic in React was rejected.

## Decision 5: Local identity stack ownership

- **Decision**: The API repository owns the canonical ZITADEL + dedicated PostgreSQL + Mailpit Compose stack. The Web repository documents and invokes that stack rather than maintaining a second configuration.
- **Rationale**: There must be one issuer, one JWKS, and one Mailpit source for cross-repo E2E. Duplicating stack files creates drift and accidental use of different client registrations.
- **Alternatives considered**: A Web-only identity Compose file was rejected because API JWKS/integration tests also need the same provider; ZITADEL Cloud was rejected for deterministic local testing.

## Decision 6: Security and browser assertions

- **Decision**: Playwright tests explicitly inspect `document.cookie`, `localStorage`, network responses, rendered HTML, and client session payloads for token names/values. Tests also assert no open redirect, safe callback failure, state/nonce/PKCE rejection, and federated logout behavior.
- **Rationale**: A visual login success is insufficient evidence of a secure BFF. Browser-level assertions catch accidental exposure that unit tests miss.
- **Alternatives considered**: Checking only server callback status was rejected; trusting Auth.js defaults without an exposure test was rejected.

## Decision 7: UX state system

- **Decision**: Reuse foundation state primitives and define explicit unauthorized, forbidden, unavailable, stale/conflict, validation, loading, empty, success, and retry states for auth/household flows. All state copy has accessible names and Spanish-neutral wording.
- **Rationale**: API errors have distinct authorization meanings and users need recovery paths. The Web constitution requires state and accessibility coverage.
- **Alternatives considered**: One generic error panel was rejected because it hides whether the user should sign in, request access, retry, or resolve a conflict.

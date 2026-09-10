# Feature Specification: OIDC BFF and Household Onboarding

**Feature Branch**: `002-oidc-bff-onboarding`

**Created**: 2026-09-10

**Status**: Implementation in progress

**Input**: User description: "Implement the next Uribap Web phase with ZITADEL OIDC/PKCE, Auth.js BFF sessions, secure cookies, protected routes, onboarding, household permissions, invitations, and complete local tests."

## User Scenarios & Testing

### User Story 1 - Sign in securely through ZITADEL (Priority: P1)

As a household user, I want to sign in and sign out through ZITADEL so that the Web application has a secure session without exposing identity-provider tokens to browser JavaScript.

**Why this priority**: Authentication is the Web boundary for every private household route and must be established before onboarding or product data is shown.

**Independent Test**: A Playwright test uses the disposable local ZITADEL stack to complete authorization-code + PKCE login, verifies the callback and protected route, inspects browser-visible cookies, refreshes the session, and completes local/federated logout.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** the visitor opens a protected application route, **Then** the Web redirects to the configured sign-in entry without rendering private household data.
2. **Given** a local ZITADEL user and a valid PKCE transaction, **When** the user completes sign-in, **Then** the Web creates a secure server-side session and redirects to the intended safe route.
3. **Given** an authenticated session, **When** the user refreshes the browser or opens a second protected route, **Then** the session remains valid without placing access or refresh tokens in `localStorage`, client props, or readable `document.cookie` values.
4. **Given** an expired, revoked, or invalid provider session, **When** the user requests a protected route, **Then** the Web clears or reauthenticates the session and shows a safe unauthorized state.
5. **Given** an authenticated user, **When** the user signs out, **Then** the local session is removed and the configured federated logout behavior is invoked without leaking tokens.

---

### User Story 2 - Complete first-time household onboarding (Priority: P1)

As a newly authenticated person, I want to create or join a household so that I can reach the Uribap application with a clear active household context.

**Why this priority**: The application cannot safely show tenant-owned planning or inventory data until the user has an active membership.

**Independent Test**: A newly authenticated local user is routed to onboarding, submits valid household settings, sees the API-created owner membership, and reaches the protected application shell; validation, API errors, and retry states are covered separately.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no active household membership, **When** the user opens the application, **Then** the Web routes to onboarding instead of exposing household pages.
2. **Given** the onboarding form, **When** the user submits a valid household name, locale, and timezone, **Then** the Web sends the mutation through the server boundary and displays the API-authoritative created household.
3. **Given** invalid input, a stale conflict, or an unavailable API, **When** the user submits onboarding, **Then** the Web shows field-level or state-specific feedback, preserves safe input, and provides an accessible recovery path.
4. **Given** the user has multiple household memberships, **When** the user selects an active household, **Then** subsequent server requests use only that selected membership context and never mix private data between households.

---

### User Story 3 - Manage members and invitations from the Web (Priority: P2)

As a household owner or administrator, I want to see members, create invitations, and manage roles so that household access can be maintained without leaving Uribap.

**Why this priority**: Household collaboration is needed for the two-person target and is the first user-visible consumer of the API permission model.

**Independent Test**: An owner opens household settings, invites a synthetic Mailpit recipient, sees pending state, and receives correct permission/error feedback when operating as member or admin.

**Acceptance Scenarios**:

1. **Given** an owner or permitted admin, **When** the user opens member settings, **Then** the Web displays only the active household's members and allowed actions.
2. **Given** a valid invite form, **When** the user submits it, **Then** the Web shows a pending invitation state based on the API response and the local Mailpit message can be inspected by the test harness.
3. **Given** a member without administration permission, **When** the member opens or submits an administration action, **Then** the Web shows a semantic forbidden state and does not expose privileged controls as actionable.
4. **Given** a stale or rejected role/invitation mutation, **When** the API responds with conflict, forbidden, or validation error, **Then** the Web shows the correct recovery state without silently changing local authority.
5. **Given** a local invitation link, **When** the recipient signs in and accepts it, **Then** the Web completes the acceptance through the server boundary and displays the resulting membership.

---

### Edge Cases

- The OIDC callback contains an invalid state, nonce, code, or PKCE verifier.
- The provider is unavailable, slow, or returns an error during login or logout.
- The API is unavailable after Web authentication succeeds.
- Access tokens expire while a server request is in flight.
- The session contains no active household, a revoked membership, or an unknown household ID.
- A user has two memberships with different roles and switches between them.
- An invitation is expired, consumed, revoked, mismatched, or already accepted.
- A browser has JavaScript disabled or reduced motion enabled.
- A user opens a deep link while unauthenticated and should return safely after login without open redirects.
- Mailpit contains no expected message or contains multiple messages after a retry.
- A forbidden response must not be confused with an unauthenticated response.

## Requirements

### Functional Requirements

- **FR-001**: The Web MUST use the configured ZITADEL OIDC provider through authorization-code flow with PKCE and validated state/nonce handling.
- **FR-002**: Authentication MUST be implemented as a server-side BFF boundary using Auth.js/next-auth-compatible session handling and secure HttpOnly cookies.
- **FR-003**: Access tokens, refresh tokens, provider secrets, authorization codes, and raw invitation tokens MUST NOT be stored in localStorage, exposed through client props, returned by browser-facing session APIs, or placed in readable browser cookies.
- **FR-004**: Protected application routes MUST require a valid Web session and MUST redirect unauthenticated visitors to sign-in without leaking private data.
- **FR-005**: The Web MUST pass API access tokens only from server-side code to the API and MUST refresh or reauthenticate according to the documented expiration boundary.
- **FR-006**: The Web MUST distinguish unauthenticated, forbidden, unavailable, validation, stale/conflict, loading, empty, success, and retry states for relevant identity and household interactions.
- **FR-007**: The Web MUST route authenticated users without a household membership to onboarding and MUST not show tenant-owned product routes before an active household is selected.
- **FR-008**: Onboarding MUST collect and validate household name, locale, and timezone, submit them to the canonical API, and render the API response as authoritative state.
- **FR-009**: The Web MUST support selecting among the user's household memberships and MUST keep the active household context server-controlled for private requests.
- **FR-010**: Owner/admin member management and invitation forms MUST expose only actions allowed by the current API permission response.
- **FR-011**: Invitation acceptance MUST require a signed-in user, use the server boundary, and display safe handling for expired, consumed, mismatched, or forbidden invitations.
- **FR-012**: Logout MUST clear the local session and perform configured provider logout behavior without exposing tokens or creating an open redirect.
- **FR-013**: Environment validation MUST separate public API base URL from server-only Auth.js/ZITADEL secrets, issuer, client ID, client secret, and session secret.
- **FR-014**: The Web MUST consume the API repository's pinned OpenAPI snapshot and regenerate the typed client when identity/household contracts change.
- **FR-015**: Login, callback, onboarding, permission, invitation, session refresh, logout, error, and recovery routes MUST have accessible names, visible focus, keyboard operation, responsive behavior at 375/768/1024/1440px, and reduced-motion-safe transitions.
- **FR-016**: Local and CI-like authentication tests MUST use disposable ZITADEL, dedicated PostgreSQL, and Mailpit; Brevo and real SMTP credentials MUST never be required locally.
- **FR-017**: The Web MUST avoid logging authorization headers, provider tokens, session secrets, invitation tokens, or unnecessary personal data.

## Key Entities

- **WebSession**: Server-controlled authenticated session containing only the minimum safe user and membership context needed by the Web boundary.
- **AuthTransaction**: Short-lived server-side OIDC transaction state for state, nonce, and PKCE correlation; it is never exposed as a reusable credential.
- **ActiveHouseholdContext**: Server-controlled selection of one authorized household membership for each private request.
- **OnboardingDraft**: Validated, non-authoritative form state used only until the API creates or joins a household.
- **InvitationAcceptance**: Server-mediated request that binds a signed-in verified identity to a valid API invitation.
- **PermissionState**: UI representation of authenticated, forbidden, unavailable, stale/conflict, loading, empty, and successful API outcomes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of protected-route tests prove unauthenticated visitors cannot see private household content and authenticated users can return safely to an allowed deep link.
- **SC-002**: 100% of browser security assertions find no access token, refresh token, authorization code, client secret, or session secret in `localStorage`, client-rendered props, or readable `document.cookie`.
- **SC-003**: A local user can complete login, onboarding, and reach the protected shell in one deterministic Playwright flow using ZITADEL without external SMTP.
- **SC-004**: 100% of Web tests distinguish unauthorized from forbidden and stale/unavailable states with accessible names and actionable recovery guidance.
- **SC-005**: 100% of responsive acceptance tests pass at 375, 768, 1024, and 1440px without horizontal overflow or loss of keyboard focus.
- **SC-006**: Session refresh and logout tests pass after token/session expiry without exposing provider tokens or leaving an authorized protected route accessible.
- **SC-007**: Invitation acceptance and member-management tests pass for owner/admin/member permissions, invalid/expired invitations, API errors, and Mailpit message assertions.
- **SC-008**: The generated Web client check is deterministic against the API snapshot and no identity/household endpoint is hand-typed outside the generated contract boundary.
- **SC-009**: The local identity stack health check reaches ready for ZITADEL, its dedicated PostgreSQL, Mailpit, API, and Web before browser tests begin.

## Assumptions

- Auth.js/next-auth is the Web BFF boundary selected by the existing Web constitution; the exact compatible package release is selected during planning using the release-age and security gates.
- ZITADEL is the local and first production identity provider, but the Web configuration keeps issuer/client settings environment-driven.
- Local email flows use synthetic addresses and Mailpit only; production Brevo is outside local acceptance and deployment secrets remain environment-managed.
- The API remains authoritative for user, membership, household, role, invitation, and tenant decisions.
- The first onboarding path creates a household; joining by invitation is supported in the same feature but does not require household discovery or social graph behavior.
- Spanish-neutral copy, accessible semantic states, and no food/product imagery remain in force.
- Product routes for recipes, inventory, meal planning, shopping, preparation, and forecasting remain placeholders until their own specs are implemented.

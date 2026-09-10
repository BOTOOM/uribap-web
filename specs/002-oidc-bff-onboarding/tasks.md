# Tasks: OIDC BFF and Household Onboarding

**Input**: Design documents from `/specs/002-oidc-bff-onboarding/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Required by the feature specification and Web constitution. Test-first tasks must fail before the corresponding implementation tasks.

**Model policy**: Luna UI/auth architecture, Sol implementation, Terra security/accessibility review, GLM-5.3 artifact analysis, SWE-2 routine fixes; no Kimi K3 without explicit escalation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Auth.js-compatible dependency boundary, environment schema, API contract, and identity test fixtures.

- [ ] T001 [P] Add the selected maintained Auth.js/next-auth ZITADEL provider dependency and record the exact compatible version in `package.json` and `pnpm-lock.yaml`.
- [ ] T002 [P] Extend server-only/public environment validation for Auth.js, ZITADEL issuer/client values, API internal URL, session secret, and local-only guards in `src/lib/config/env.ts` and `.env.example`.
- [ ] T003 Reserve generated API contract metadata for identity/household endpoints in `contracts/metadata.json` and `contracts/uribap-api.openapi.json`; complete only after API T027 publishes the identity snapshot.
- [ ] T004 [P] Add identity test fixtures, safe synthetic users, and Playwright tags/fixtures in `tests/setup.ts`, `e2e/fixtures/identity.ts`, and `playwright.config.ts`.
- [ ] T005 [P] Add Web contract/state test scaffolding in `tests/component/auth/`, `tests/component/households/`, and `tests/accessibility/identity.spec.ts`.

**Checkpoint**: Dependencies/configuration are secret-free and test boundaries exist; no tokens are exposed and no protected route behavior is changed yet.

---

## Phase 2: Foundational BFF Boundary

**Purpose**: Implement secure Auth.js session handling, server-only API access, route protection, and common auth states before onboarding or invitations.

**CRITICAL**: No user story UI work can begin until this phase passes unit/security checks.

### Tests first

- [ ] T006 [P] Write Auth.js configuration tests for provider issuer, callback path, PKCE/state/nonce settings, safe return paths, and missing env failures in `tests/unit/auth/auth-config.test.ts`.
- [ ] T007 [P] Write server session-shape tests proving access/refresh/id tokens and secrets never appear in public session output or client props in `tests/unit/auth/session-shape.test.ts`.
- [ ] T008 [P] Write server API client tests for bearer injection, 401/403/409/503 mapping, no browser bearer headers, and token redaction in `tests/unit/auth/server-client.test.ts`.
- [ ] T009 [P] Write route protection tests for unauthenticated redirect, no-membership onboarding redirect, allowlisted deep-link return, and open-redirect rejection in `tests/unit/auth/route-protection.test.ts`.
- [ ] T010 [P] Write browser security tests for `document.cookie`, localStorage, sessionStorage, rendered HTML, and client payload token non-exposure in `e2e/security.spec.ts`.

### Implementation

- [ ] T011 [P] Configure Auth.js ZITADEL provider, server callbacks, encrypted session strategy, safe public session projection, refresh metadata, and logout behavior in `src/lib/auth/auth.ts` and `src/lib/auth/callbacks.ts`.
- [ ] T012 [P] Add the App Router Auth.js handler at `src/app/api/auth/[...nextauth]/route.ts` and typed auth/session helpers in `src/lib/auth/session.ts`.
- [ ] T013 [P] Implement server-only API client and Problem Details mapping in `src/lib/api/server-client.ts` and `src/lib/api/errors.ts`.
- [ ] T014 [P] Implement server route protection and safe return-path handling in `src/middleware.ts`, `src/lib/auth/route-protection.ts`, and `src/app/(app)/layout.tsx`.
- [ ] T015 [P] Add login, auth-error, and logout entry states with accessible semantic controls in `src/app/(public)/login/page.tsx`, `src/app/auth-error/page.tsx`, and `src/components/auth/SignInButton.tsx`.
- [ ] T016 [P] Add Auth.js/ZITADEL environment documentation and local no-Brevo guard in `src/lib/config/env.ts`, `.env.example`, and `docs/security/identity-boundary.md`.
- [ ] T017 Run `tests/unit/auth/`, `tests/component/auth/`, and `e2e/security.spec.ts` tests and confirm they fail before implementation, then pass after T011–T016 without exposing tokens in client output.

**Checkpoint**: Login/callback/session/logout boundary is server-controlled; protected routes distinguish unauthenticated from forbidden/unavailable and browser security assertions pass.

---

## Phase 3: User Story 1 - Secure ZITADEL Sign-in (Priority: P1) 🎯 MVP

**Goal**: Complete local authorization-code + PKCE login, session refresh, safe protected routing, and logout.

**Independent Test**: A local Playwright flow signs in through ZITADEL, reaches a protected route, survives refresh, rejects expiry, and logs out while browser security assertions pass.

### Tests first

- [ ] T018 [P] [US1] Write Playwright login/callback tests against local ZITADEL discovery and PKCE in `e2e/auth.spec.ts`.
- [ ] T019 [P] [US1] Write Playwright session-expiry/refresh/logout/federated-logout tests in `e2e/auth-session.spec.ts`.
- [ ] T020 [P] [US1] Write component tests for login loading, provider error, unauthorized, retry, and signed-in states in `tests/component/auth/login-state.test.tsx`.
- [ ] T021 [P] [US1] Write accessibility tests for login/auth-error/logout controls, focus return, reduced motion, and keyboard operation in `tests/accessibility/identity.spec.ts`.

### Implementation

- [ ] T022 [US1] Implement login initiation, callback error handling, and safe deep-link return behavior in `src/app/(public)/login/page.tsx`, `src/app/auth-error/page.tsx`, and `src/lib/auth/route-protection.ts`.
- [ ] T023 [US1] Implement session refresh/expiry handling and provider logout callback in `src/lib/auth/callbacks.ts`, `src/app/api/auth/[...nextauth]/route.ts`, and `src/app/api/auth/logout/callback/route.ts`.
- [ ] T024 [US1] Add protected route loading/error boundaries and unauthorized state components in `src/app/(app)/loading.tsx`, `src/app/(app)/error.tsx`, and `src/components/states/UnauthorizedState.tsx`.
- [ ] T025 [US1] Add local ZITADEL connection/readiness diagnostics without rendering secrets in `src/features/auth/identity-status.ts` and `src/app/(public)/login/page.tsx`.

**Checkpoint**: Login, refresh, logout, callback failures, accessibility, and browser token non-exposure pass independently against local ZITADEL.

---

## Phase 4: User Story 2 - First-Time Household Onboarding (Priority: P1)

**Goal**: Route authenticated users without membership to onboarding, create a household through the API, and establish an active server-validated context.

**Independent Test**: A new local user signs in, is redirected to onboarding, submits valid settings, recovers from validation/conflict/unavailable states, and reaches the protected shell with the API-authoritative household.

### Tests first

- [ ] T026 [P] [US2] Write component tests for onboarding validation, loading, API error, conflict, retry, success, and reduced-motion feedback in `tests/component/households/onboarding-form.test.tsx`.
- [ ] T027 [P] [US2] Write route tests for no-membership redirect, existing-membership redirect, active-household selection, and protected-route gating in `tests/unit/households/onboarding-route.test.ts`.
- [ ] T028 [P] [US2] Write Playwright onboarding tests for create-household, API unavailable/error, stale conflict, and deep-link recovery in `e2e/onboarding.spec.ts`.
- [ ] T029 [P] [US2] Write accessibility/responsive tests for onboarding form, labels, focus, keyboard, touch targets, and 375/768/1024/1440px in `tests/accessibility/onboarding.spec.ts`.

### Implementation

- [ ] T030 [P] [US2] Implement typed onboarding schema and server action/route handler using the server API client in `src/features/households/onboarding-schema.ts`, `src/features/households/actions.ts`, and `src/app/(public)/onboarding/page.tsx`.
- [ ] T031 [P] [US2] Implement onboarding form and explicit state components in `src/components/household/OnboardingForm.tsx`, `src/components/states/ConflictState.tsx`, and `src/components/states/UnavailableState.tsx`.
- [ ] T032 [US2] Implement authenticated active-household context selection and server validation in `src/lib/auth/active-household.ts`, `src/lib/auth/session.ts`, and `src/app/(app)/layout.tsx`.
- [ ] T033 [US2] Integrate API-authoritative created household/membership into the shell and existing navigation in `src/components/shell/AppShell.tsx`, `src/features/households/HouseholdProvider.tsx`, and `src/app/(app)/page.tsx`.

**Checkpoint**: New users can onboard or recover safely; no household page renders without a server-validated active membership.

---

## Phase 5: User Story 3 - Members and Invitations (Priority: P2)

**Goal**: Render household member management, role-driven controls, invitation creation/acceptance, and Mailpit-backed feedback.

**Independent Test**: Owner/admin/member sessions see only permitted actions; owner creates an invitation, Mailpit receives it, and a recipient accepts it through the server boundary.

### Tests first

- [ ] T034 [P] [US3] Write component tests for member list, role controls, invitation form, pending/empty/error/forbidden states, and safe redaction in `tests/component/households/member-management.test.tsx`.
- [ ] T035 [P] [US3] Write role-driven route/component tests for owner/admin/member permission presentation in `tests/unit/households/permissions.test.ts`.
- [ ] T036 [P] [US3] Write Playwright member-management tests for invite, role change, revoke, forbidden member actions, and stale conflict in `e2e/household-permissions.spec.ts`.
- [ ] T037 [P] [US3] Write Playwright invitation/Mailpit tests for synthetic recipient, message assertion, sign-in, one-time acceptance, expired/consumed/mismatched states in `e2e/invitation.spec.ts`.
- [ ] T038 [P] [US3] Write accessibility/responsive tests for household settings dialogs/forms/tables at required viewports in `tests/accessibility/household-settings.spec.ts`.

### Implementation

- [ ] T039 [P] [US3] Implement household settings/member list route and API server calls in `src/app/(app)/settings/household/page.tsx`, `src/features/households/member-actions.ts`, and `src/components/household/MemberList.tsx`.
- [ ] T040 [P] [US3] Implement role/revoke controls and accessible confirmation dialogs in `src/components/household/MemberRoleControl.tsx` and `src/components/household/RevokeMemberDialog.tsx`.
- [ ] T041 [P] [US3] Implement invitation creation/list/revoke UI with API-authoritative states in `src/components/household/InvitationForm.tsx`, `src/components/household/InvitationList.tsx`, and `src/features/households/invitation-actions.ts`.
- [ ] T042 [US3] Implement the GET invitation acceptance page and separate POST BFF route with safe token handling in `src/app/(public)/invitations/accept/page.tsx`, `src/app/api/invitations/accept/route.ts`, and `src/features/households/invitation-actions.ts`.
- [ ] T043 [US3] Integrate role/active-household summaries into session refresh without exposing provider tokens in `src/lib/auth/callbacks.ts` and `src/lib/auth/session.ts`.

**Checkpoint**: Owner/admin/member permissions, invitation lifecycle, Mailpit assertions, and recovery states pass independently.

---

## Phase 6: Contract, Local Identity, and Release Gates

**Purpose**: Align the generated client and run the complete Web/identity verification workflow.

- [ ] T044 [P] Regenerate and verify `src/lib/api/generated/schema.ts` from `contracts/uribap-api.openapi.json` with `pnpm api:check`.
- [ ] T045 [P] Add local identity stack connection documentation pointing to `../api/identity/compose.identity.yml` in `identity/README.md` and `docs/operations/identity-local.md`.
- [ ] T046 [P] Add Playwright identity fixture cleanup/log preservation without automatic volume deletion in `e2e/fixtures/identity.ts` and `playwright.config.ts`.
- [ ] T047 [P] Add browser console/network security assertions for no Authorization headers from client components in `e2e/security.spec.ts`.
- [ ] T048 Run the Web testing skill workflow: lint, typecheck, API check, Vitest, build, Docker health, Playwright, axe, responsive, audit, license, performance, and record results in `specs/002-oidc-bff-onboarding/quickstart.md`.
- [ ] T049 Run the local identity testing skill and record issuer/client setup, PKCE, refresh/logout, cookie/token checks, tenant isolation, Mailpit, health, skipped flows, and cleanup in `specs/002-oidc-bff-onboarding/quickstart.md`.
- [ ] T050 [P] Review `AGENTS.md`, `.devin/skills/uribap-web-testing/SKILL.md`, and `.devin/skills/uribap-local-identity-testing/SKILL.md` for any new durable identity command or boundary introduced by this feature.
- [ ] T051 [P] Implement the public Web health route and Docker/readiness assertion in `src/app/api/health/route.ts`, `tests/unit/health-route.test.ts`, and `e2e/identity-stack-health.spec.ts`.
- [ ] T052 Complete final read-only Spec Kit analysis and convergence; record results in `specs/002-oidc-bff-onboarding/analyze.md`, `specs/002-oidc-bff-onboarding/converge.md`, and `tasks.md` before closing the feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** has no feature-code dependency and may run in parallel.
- **Phase 2** depends on Phase 1 and blocks all user stories.
- **US1 (Phase 3)** depends on Phase 2.
- **US2 (Phase 4)** depends on US1's safe session and server API client.
- **US3 (Phase 5)** depends on US2's active-household context and API contract.
- **Phase 6** depends on the story implementations and is the final release gate.

### Parallel Opportunities

- T001–T005 can run in parallel in separate files.
- T006–T010 can run in parallel before foundational implementation.
- T018–T021, T026–T029, and T034–T038 can each run in parallel.
- T011–T016 can run in parallel where files do not overlap.
- T044–T047 can run in parallel after the API contract snapshot is published.

### MVP Scope

MVP is Phase 1 + Phase 2 + User Story 1 (T001–T025): secure local ZITADEL login, BFF session, protected route, refresh/logout, and browser token non-exposure. Onboarding and collaboration follow as independently testable increments.

### Notes

- Every task includes a file path and uses the required checkbox/ID format.
- Tests must be written and observed failing before their implementation task.
- No client component may receive a bearer token; no local test may use Brevo or real email.
- Mark tasks complete only after their documented command and quickstart evidence exists.

---

## Phase 7: Convergence (Remaining Work)

- [ ] T053 [P] Add dedicated Auth.js session-shape/unit tests for refresh rotation, expired access tokens, safe public session projection, and federated logout in `tests/unit/auth/session-shape.test.ts`, `tests/unit/auth/refresh.test.ts`, and `e2e/auth-session.spec.ts`. (FR-002, FR-003, FR-012; missing)
- [ ] T054 [P] Add owner/admin/member role-control and stale/conflict component/E2E coverage for household settings in `tests/component/households/member-management.test.tsx`, `tests/component/households/invitation-form.test.tsx`, and `e2e/household-permissions.spec.ts`. (FR-006, FR-010; missing)
- [ ] T055 [P] Add a second synthetic local user flow that accepts a Mailpit invitation once and rejects expired/mismatched invitations in `e2e/invitation.spec.ts`; assert recipient, subject, and one-time state without logging the raw link. (FR-011, SC-007; missing)
- [ ] T056 [P] Add a server-only Docker identity overlay/env guide and validate Auth.js issuer/API internal URL from the Web container in `compose.identity.yml`, `identity/README.md`, and `e2e/identity-stack-health.spec.ts`. (FR-013, FR-016; missing)
- [x] T057 [P] Migrate the Next.js 16 route guard from `src/middleware.ts` to `src/proxy.ts`, update the feature plan, and remove the build deprecation warning. (Plan/runtime hygiene; partial)
- [ ] T058 Run `/uribap-web-testing` and `/uribap-local-identity-testing` with all required audit, accessibility, responsive, performance, Docker, Mailpit, refresh/logout, and invitation evidence in `specs/002-oidc-bff-onboarding/quickstart.md`. (SC-003, SC-006, SC-007, SC-009; partial)
- [ ] T059 Re-run read-only Spec Kit analysis and update `specs/002-oidc-bff-onboarding/analyze.md` and `converge.md`; only then mark this feature converged. (Constitution workflow; missing)

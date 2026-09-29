# Tasks: ZITADEL Household Invitations

**Input**: Design documents from `specs/014-zitadel-invitations/`

## Phase 1: Specification and API contract

- [x] T001 Complete feature specification, plan, requirements checklist, analysis, and quickstart.
- [x] T002 After API push, pin its OpenAPI snapshot and SHA/schema metadata, run `pnpm api:generate`, and update the contract test.

## Phase 2: Token-preserving acceptance

- [x] T003 Add a pure invitation return-target helper and unit tests for token, missing-token, and encoding behavior.
- [x] T004 Read the token before the auth check and preserve it through the login redirect.
- [x] T005 Add the authenticated BFF route for by-ID invitation acceptance.

## Phase 3: Invitation creation and status copy

- [x] T006 Add optional invitee name input and omit `display_name` when it is empty.
- [x] T007 Use generated response types and display the exact status for each delivery outcome.
- [x] T008 Replace Mailpit-specific invitation copy and test all delivery, payload, and API-error states.

## Phase 4: Onboarding pending invitations

- [x] T009 Fetch pending invitations server-side and treat failures as an empty list without interrupting onboarding.
- [x] T010 Add `PendingInvitations` with household, Spanish role, expiry, accept action, pending state, and accessible error.
- [x] T011 Add the create-own-household divider and preserve the existing onboarding form.
- [x] T012 Add component tests for rendering, correct POST URL, `/plan` navigation/refresh, and error state.

## Phase 5: Verification and convergence

- [x] T013 Run all requested pnpm install, lint, typecheck, test, API contract, build, and diff checks.
- [x] T014 Record verification and the intentionally omitted authenticated-browser/ZITADEL check in `converge.md`.
- [x] T015 Commit and push the Web branch after the API branch SHA is available.

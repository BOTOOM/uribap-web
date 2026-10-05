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

## Phase 6: Review follow-up

- [x] T016 Render pending invitations in household settings when available and ignore list-load failures.
- [x] T017 Format invitation expiry as UTC during SSR and initial hydration, then browser-local time; use `<time>` and unit coverage.
- [x] T018 Refresh the contract metadata generation date without changing the API revision or schema version.
- [x] T019 Move invitation tokens out of URLs and client props through per-flow HttpOnly cookies with the 168-hour lifetime; clear only the matching flow cookie after acceptance and invalid-token responses.
- [x] T020 Verify token validation, per-tab flow isolation, proxy bypass, flow-only return targets, cookie lifecycle, and security-header invariants.
- [x] T021 Run requested checks and record the review follow-up in `converge.md`.

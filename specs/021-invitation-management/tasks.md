# Tasks: Household Invitation Management

**Input**: Design documents from `specs/021-invitation-management/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/invitation-management.md`, `quickstart.md`

**Tests**: Add the focused panel component test before closing implementation tasks. Update the contract test with the API snapshot.

**Organization**: Tasks are grouped by user story after shared contract and BFF work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel on different files without dependencies on unfinished tasks.
- **[Story]**: Maps implementation tasks to the user stories in `spec.md`.
- Paths below are relative to the Web repository root.

## Phase 1: Setup — Pin the API Contract

**Purpose**: Generate the typed Web contract from the pushed API invitation revision.

- [X] T001 Copy API revision `c0386230a7b04176e86eaa0984b99a4d90c327e5` into `contracts/uribap-api.openapi.json`, update `contracts/metadata.json` to v17 and `2026-10-14`, then run `pnpm api:generate` for `src/lib/api/generated/schema.ts`.
- [X] T002 [P] Update `tests/unit/api-contract.test.ts` to assert the API revision, v17 metadata, the invitation listing/revoke paths, and `InvitationResponse.effective_status`/`delivery`.

---

## Phase 2: Foundational — BFF Proxies

**Purpose**: Expose the invitation listing and revoke operations through the established session boundary.

- [X] T003 Add `GET` to `src/app/api/households/[householdId]/invitations/route.ts` proxying `serverApiFetch("/households/{id}/invitations")` with the file's existing error mapping.
- [X] T004 [P] Create `src/app/api/households/[householdId]/invitations/[invitationId]/route.ts` with `DELETE` proxying the revoke endpoint and returning `204`, following `members/[userId]/route.ts`.

**Checkpoint**: Both proxies compile and reuse the shared error mapping.

---

## Phase 3: User Story 1 — Invitation Listing Panel (Priority: P1) 🎯 MVP

**Goal**: Owners/admins see every household invitation with email, role, effective status, delivery outcome, and expiry.

**Independent Test**: With invitations in all four effective statuses and varied deliveries, verify each row renders the Spanish labels, badge classes, and expiry date; members never receive the panel.

### Implementation for User Story 1

- [X] T005 [US1] Create `src/components/household/InvitationManagement.tsx` (client component) rendering rows with email, role label, `effective_status` badge (`pendiente`/`vencida`/`aceptada`/`revocada`), delivery label (`enviada`/`fallida`/`cuenta existente`/`pendiente`/`sin enviar`), and `formatInvitationExpiry` expiry, with loading/empty/error states per `MemberManagement`/`PendingInvitations` patterns.
- [X] T006 [US1] Extend `loadHouseholdData` in `src/app/(app)/settings/household/page.tsx` to fetch `InvitationPage` only for owner/admin (failure → `null` list rendered as panel error state) and render the `InvitationManagement` card alongside members.

**Checkpoint**: The panel renders the API-provided states verbatim for managers and stays hidden for members.

---

## Phase 4: User Stories 2–3 — Resend and Revoke Actions (Priority: P1)

**Goal**: Owners/admins can resend expired/failed invitations and revoke pending ones, with the list refreshing after each action.

**Independent Test**: Verify `Reenviar` is offered exactly on expired or failed-delivery rows (with the existing-account variant labelled for in-app delivery) and `Revocar` exactly on pending rows; each action refreshes once and failures surface alerts.

### Implementation for User Stories 2–3

- [X] T007 [US2] Add the `Reenviar` action to `InvitationManagement`: POST `{ email }` to `/api/households/{id}/invitations` when `effective_status === "expired"` or `delivery === "failed"`, label the existing-account case as in-app delivery, then refetch the list.
- [X] T008 [US3] Add the `Revocar` action to `InvitationManagement`: DELETE `/api/households/{id}/invitations/{invitationId}` when `effective_status === "pending"`, then refetch the list; surface action failures via `role="alert"` while keeping the rendered list.

**Checkpoint**: Both actions respect the enablement rules, refresh the list, and handle errors without losing state.

---

## Phase 5: Tests, Polish and Converge

**Purpose**: Validate the feature, record evidence, and deliver the Web branch.

- [X] T009 [P] Add `tests/component/household/InvitationManagement.test.tsx` covering status/delivery rendering, expiry formatting, resend/revoke enablement, the existing-account label, refetches, and error alerts.
- [X] T010 Run the focused tests, `pnpm lint`, `pnpm typecheck`, `pnpm api:check`, `pnpm test`, `pnpm build`, and `/uribap-web-testing`; compare `contracts/uribap-api.openapi.json` with the pinned API revision and run `git diff --check`.
- [X] T011 Record executed and skipped checks, results, and any concrete blockers in `specs/021-invitation-management/converge.md`.
- [X] T012 Commit the feature files and push `devin/1791942362-invitation-management`, leaving the untracked `src/app/dev-preview/` directory untouched and unstaged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pin and generate the API contract before using its invitation types.
- **Foundational (Phase 2)**: T003/T004 precede the panel's client refetch and revoke action.
- **User Stories (Phases 3–4)**: The panel (T005) precedes its actions (T007/T008); page integration (T006) is independent of T003/T004.
- **Polish (Phase 5)**: Runs after panel and page integration are complete.

### Parallel Opportunities

- T002 and T003 touch separate files after T001.
- T003 and T004 touch separate route files.
- T009 touches its own test file once the panel exists.

## Implementation Strategy

1. Sync the API v17 contract and generate its client types.
2. Add the BFF `GET`/`DELETE` proxies.
3. Build the panel, then integrate it into the settings page for managers.
4. Wire resend/revoke with refresh and error handling.
5. Add the component test, run the gates, record convergence, commit, and push.

## Notes

- Do not hand-edit `contracts/uribap-api.openapi.json` or `src/lib/api/generated/schema.ts`.
- Do not stage or commit `src/app/dev-preview/`.
- The pinned API revision is unmerged (API PR #160); this Web change depends on that API deploying
  first and its pull request stays a draft until then.

# Feature Specification: Household Invitation Management

**Feature Branch**: `devin/1791942362-invitation-management`

**Created**: 2026-10-14

**Status**: Draft

**Input**: Show household owners and administrators every invitation they have sent — with its email, requested role, effective status, and delivery outcome — and let them resend invitations that expired or failed and revoke invitations that are still pending.

## User Scenarios & Testing

### User Story 1 - See every household invitation with its real state (Priority: P1)

A household owner or administrator opens the household settings and sees the complete list of invitations sent for that household, each showing the invited email, the requested role, the effective status (pending, expired, accepted, or revoked), the delivery outcome, and the expiry date.

**Why this priority**: Today an owner can create invitations but cannot see whether they were delivered, accepted, expired, or revoked, so they cannot tell if someone actually received access.

**Independent Test**: With a household that has one pending, one expired, one accepted, and one revoked invitation with different delivery outcomes, open the household settings as owner and verify each row shows email, role, effective status badge, delivery outcome, and expiry date.

**Acceptance Scenarios**:

1. **Given** a household with invitations in every effective status, **When** an owner or admin opens the household settings, **Then** every invitation is listed with its email, requested role, effective status, delivery outcome, and expiry date.
2. **Given** an invitation whose pending status passed its expiry date, **When** the list renders, **Then** it is shown as expired rather than pending.
3. **Given** a household with no invitations, **When** the list renders, **Then** an empty state is shown instead of a blank panel.
4. **Given** a member without the owner or administrator role, **When** they open the household settings, **Then** the invitation list is not offered to them.
5. **Given** the invitation listing cannot be loaded, **When** the settings page renders, **Then** the panel reports a loading failure without breaking the rest of the page.

### User Story 2 - Resend an expired or undelivered invitation (Priority: P1)

An owner or administrator can resend an invitation when it expired or its delivery failed, so the invited person gets a fresh invitation email — or, when they already have an account, sees the invitation again inside the app.

**Why this priority**: An expired or undelivered invitation is dead weight; without resend the owner would have no recovery path for a missed email.

**Independent Test**: With invitations covering each effective status and delivery outcome, verify the resend action is only offered for expired or failed-delivery invitations, trigger it, and confirm the refreshed list reflects the new invitation state.

**Acceptance Scenarios**:

1. **Given** an invitation with effective status expired, **When** the owner chooses resend, **Then** a new invitation is created for the same email and the list refreshes.
2. **Given** an invitation whose delivery failed, **When** the owner chooses resend, **Then** a new invitation is created for the same email and the list refreshes.
3. **Given** an invitation whose delivery outcome means the invitee already has an account, **When** the owner resends it, **Then** the interface communicates that the person will see the invitation again inside the app rather than by email.
4. **Given** an invitation that is still validly pending, accepted, or revoked with successful delivery, **When** the row renders, **Then** resend is not offered.
5. **Given** a resend request fails, **When** the action completes, **Then** the panel surfaces the failure and the list keeps its prior state.

### User Story 3 - Revoke a pending invitation (Priority: P1)

An owner or administrator can revoke an invitation that is still pending, cancelling access before it is accepted.

**Why this priority**: A mistaken or stale invitation should not remain a valid path into the household.

**Independent Test**: With a pending invitation, revoke it, and verify the list refreshes and shows the revoked effective status; verify revoke is not offered for accepted, expired, or already-revoked invitations.

**Acceptance Scenarios**:

1. **Given** an invitation with effective status pending, **When** the owner chooses revoke, **Then** the invitation is revoked and the list refreshes to show it.
2. **Given** an invitation that is expired, accepted, or revoked, **When** the row renders, **Then** revoke is not offered.
3. **Given** a revoke request fails, **When** the action completes, **Then** the panel surfaces the failure and the list keeps its prior state.

### Edge Cases

- The invitation list is empty, or the listing request fails while members load normally.
- The viewer has the member role; the API rejects the listing and the panel is hidden entirely.
- An invitation expires between page load and interaction; a failed revoke or resend surfaces its error rather than assuming success.
- Resend reuses the create-invitation operation, so a resend for an email that already has a valid pending invitation is rejected by the API and shown as an error.
- The invited person already has an account; resend makes the invitation visible inside the app instead of sending email.

## Requirements

### Functional Requirements

- **FR-001**: Owners and administrators MUST see every invitation of the active household in the household settings, with invited email, requested role, effective status, delivery outcome, and expiry date for each.
- **FR-002**: The effective status MUST show the invitation as expired when a pending invitation's expiry has passed, and as pending, accepted, or revoked otherwise.
- **FR-003**: The delivery outcome MUST distinguish a sent email, a failed send, an existing-account delivery, a pending send, and the absence of a delivery record.
- **FR-004**: A resend action MUST be offered only for invitations whose effective status is expired or whose delivery failed.
- **FR-005**: Resend MUST create a fresh invitation for the same email through the existing create-invitation flow and MUST refresh the list afterwards.
- **FR-006**: When resend targets an invitee who already has an account, the UI MUST communicate that the person will see the invitation inside the app.
- **FR-007**: A revoke action MUST be offered only for invitations whose effective status is pending, and MUST refresh the list afterwards.
- **FR-008**: Members without the owner or administrator role MUST NOT be offered the invitation list or its actions.
- **FR-009**: Loading, empty, error, and action-pending states MUST follow the page's existing patterns and Spanish copy.
- **FR-010**: Invitation data MUST come from the FastAPI listing through the existing authenticated BFF boundary; the Web layer MUST NOT recompute statuses itself beyond rendering the API-provided effective status.

### Key Entities

- **Household invitation**: An invitation record owned by a household, identified by its id, invited email, and requested role; the API reports its stored status, effective status, delivery outcome, expiry, and creation times.
- **Effective status**: The API-derived invitation state (`pending`, `expired`, `accepted`, `revoked`); `pending` becomes `expired` once the expiry passes.
- **Delivery outcome**: The API-derived result of the invitation delivery (`sent`, `failed`, `existing_account`, `pending`, or absent).
- **Invitation listing**: A complete view of the household's invitations owned by the API; the Web renders it without inventing missing entries.

## Success Criteria

### Measurable Outcomes

- **SC-001**: With invitations covering all four effective statuses, the settings page shows each one with the correct Spanish status badge, delivery outcome, role, email, and expiry date.
- **SC-002**: Resend is offered on exactly the expired or failed-delivery rows, revoke on exactly the pending rows, and each action refreshes the list once.
- **SC-003**: A member-role viewer never receives the invitation panel, and the rest of the settings page still loads when the listing fails.
- **SC-004**: After a resend for an existing-account invitee, the page communicates the in-app delivery path rather than email.
- **SC-005**: A failed resend or revoke surfaces an error message and leaves the previously rendered list intact.

## Assumptions

- The API revision pinned by this feature provides `GET /households/{household_id}/invitations` with `effective_status` and `delivery` on each item, and `DELETE /households/{household_id}/invitations/{invitation_id}` for revoke. That API change ships in its own pull request before this Web feature deploys.
- Resend reuses the existing create-invitation `POST` endpoint; the API renews an expired pending invitation for the same email and rejects re-inviting while a valid pending invitation exists.
- The invitation listing is small enough that the API's default page limit covers realistic households.
- Owners and administrators are the only roles the API allows to read the listing; members never receive the panel.

## Out of Scope

- Changing API invitation, delivery, or outbox behavior.
- Filtering, sorting, or paginating the invitation list beyond the API's ordering.
- Editing a pending invitation's role or email; the owner revokes and creates a new one instead.
- Member-facing invitation acceptance flows, which already exist.
- Any change to the member management panel beyond sharing the page.

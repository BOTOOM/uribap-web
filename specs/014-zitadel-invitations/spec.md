# Feature Specification: ZITADEL Household Invitations

**Feature Branch**: `014-zitadel-invitations`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: Connect household invitations to ZITADEL, show delivery outcomes, and let signed-in invitees accept pending invitations without copying a token.

## User Scenarios & Testing

### User Story 1 - Invite a person and understand delivery (Priority: P1)

A household owner invites someone by email, optionally includes their name, and sees a clear explanation of what happens next. A new person receives an account-setup email; an existing account holder is told to sign in and accept in the app.

**Why this priority**: Clear feedback prevents owners from assuming an invitation email was sent when the person already has an account or delivery failed.

**Independent Test**: Submit invitation form responses for every reported delivery outcome and verify the correct Spanish message, optional-name behavior, and recoverable error state.

**Acceptance Scenarios**:

1. **Given** an owner invites a new person, **When** account setup is requested, **Then** the UI says the person will receive an email and see the household invitation in Uribap.
2. **Given** the invited person already has an account, **When** the invitation is created, **Then** the UI explains that they can accept after signing in.
3. **Given** application email is used or delivery fails, **When** the invitation is created, **Then** the UI shows the corresponding email-sent or saved-but-not-sent message.
4. **Given** the optional name is blank, **When** the invitation is submitted, **Then** the outgoing invitation contains no name.

---

### User Story 2 - Accept an invitation after signing in (Priority: P1)

A person who opens a token link while signed out returns to that invitation after login. A signed-in person with verified-email invitations can review the household, role, and expiry during onboarding and accept with one action.

**Why this priority**: The token must survive authentication, and existing accounts need to accept an invitation without another email or token copy.

**Independent Test**: Verify that the invitation link survives sign-in, pending invitations show useful details, and accepting one takes the person to the household plan.

**Acceptance Scenarios**:

1. **Given** a signed-out person opens an invitation URL with a token, **When** they are redirected to login, **Then** the return target contains that token.
2. **Given** onboarding loads pending invitations, **When** invitations are present, **Then** each displays the household, localized role, and expiry.
3. **Given** a person accepts a pending invitation, **When** the request succeeds, **Then** they are sent to `/plan` and the page refreshes.
4. **Given** acceptance fails, **When** the person tries again, **Then** an accessible error is displayed without leaving onboarding.

---

### User Story 3 - Keep onboarding available during invitation lookup failures (Priority: P2)

A signed-in person can still create a household if pending invitations cannot be loaded.

**Why this priority**: The new invitation lookup must not block the existing onboarding path.

**Independent Test**: Make pending invitations unavailable while onboarding loads and verify the create-household form remains available with no invitation list.

**Acceptance Scenarios**:

1. **Given** the pending invitation request fails, **When** onboarding is rendered, **Then** no invitations are shown and household creation remains usable.
2. **Given** pending invitations are shown, **When** the person chooses to create a separate household, **Then** the existing onboarding form remains available below the invitation list.

## Edge Cases

- Return targets must preserve encoded query data and remain safe internal paths.
- A successful invitation creation must render exactly one message corresponding to its delivery value.
- Empty display names must not be sent with an invitation.
- Failure to retrieve pending invitations must not block the household-creation form.
- Acceptance errors must remain visible and the user must not be navigated away.
- The invitation list must handle an empty response without adding a misleading section.

## Requirements

### Functional Requirements

- **FR-001**: The invite form MUST support an optional invitee name and omit `display_name` when blank.
- **FR-002**: The invite form MUST explain that a person without an account will receive an account-setup email.
- **FR-003**: The invite form MUST show the exact delivery-specific Spanish status:
  - `zitadel_invite`: “Invitación creada. {email} recibirá un correo para crear su acceso y verá la invitación al entrar a Uribap.”
  - `existing_account`: “Invitación creada. Esta persona ya tiene cuenta: verá la invitación al entrar a Uribap.”
  - `email`: “Invitación enviada por correo.”
  - `failed`: “La invitación quedó creada, pero no se pudo enviar el correo. Pídele que entre a Uribap con este email para aceptarla.”
- **FR-004**: The token-acceptance login redirect MUST preserve the invitation token in its return target.
- **FR-005**: Onboarding MUST request pending invitations and show them only when the request succeeds with items.
- **FR-006**: Each pending invitation MUST show its household name, Spanish role label, expiry, and an acceptance action.
- **FR-007**: Successful in-app acceptance MUST navigate to `/plan` and refresh the route; failure MUST remain visible.
- **FR-008**: Failure to retrieve invitations MUST NOT prevent the existing household-creation form from rendering.
- **FR-009**: Existing account-creation onboarding MUST remain available below pending invitations.
- **FR-010**: Invitation delivery, verification, and acceptance behavior MUST be consistent across invitation entry points.

### Key Entities

- **Delivery outcome**: The result of invitation delivery, used to select user-facing status copy.
- **Pending household invitation**: An invitation for the signed-in person's verified email, including household, role, inviter, and expiry information.
- **Invitation return target**: The safe internal destination used after sign-in, including the original invitation token when present.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Each of the four delivery outcomes produces its specified Spanish message.
- **SC-002**: A signed-out invitation link returns to the original token-bearing acceptance route after login.
- **SC-003**: A person can accept a displayed pending invitation with one action and is navigated to `/plan` on success.
- **SC-004**: A pending-invitation lookup failure does not remove the household-creation form from onboarding.
- **SC-005**: Invitation acceptance errors are exposed through an accessible alert and do not trigger success navigation.

## Assumptions

- The account-setup email is sent by ZITADEL; the Web UI does not manage identity setup.
- Automated component and unit checks are sufficient for this task; no authenticated browser or live ZITADEL check will be run.

# Data Model: Household Invitation Management

## Persistence

This Web feature adds no persisted entities, database fields, or mutations. Invitation records,
their status transitions, and the email-outbox delivery tracking remain owned by the API.

## API Response Entities

### `InvitationPage`

- `items`: array of `InvitationResponse` for the household, in API order.
- `page_info`: `PageInfo` describing the applied `limit`; the listing is a single page for
  realistic household sizes.

### `InvitationResponse`

- `id`: invitation UUID used by the revoke endpoint.
- `household_id`: owning household UUID.
- `email`: invited person's email; resend reuses it as the create payload.
- `requested_role`: `admin` or `member`; rendered with the existing Spanish role labels.
- `status`: stored lifecycle state on the API row.
- `effective_status`: derived view state — `pending`, `expired`, `accepted`, or `revoked`. A
  `pending` row whose `expires_at` has passed reports `expired`.
- `delivery`: latest outbox outcome — `sent`, `failed`, `existing_account` (send suppressed
  because the invitee already has an account), `pending`, or `null` when no outbox entry exists.
- `expires_at`: expiry instant rendered with `formatInvitationExpiry`.
- `invited_by_user_id`, `created_at`: provenance fields not shown by the panel.

## Action Rules Derived From the Model

- Resend is offered only when `effective_status === "expired"` or `delivery === "failed"`.
- Revoke is offered only when `effective_status === "pending"`.
- Resend reuses `create_invitation` with `{ email }`; the API renews the expired invitation and
  reports the fresh delivery outcome, including `existing_account` when the invitee already has an
  account and will see the invitation in-app.

## Relationships and Rules

- An invitation belongs to exactly one household and is visible only to its owner/admin members.
- `effective_status` is the display authority; the panel never infers state from `expires_at`.
- A successful resend creates a new invitation row for the same email (the list refreshes rather
  than mutating the old row in place).
- A successful revoke transitions a pending invitation to `revoked`; the API rejects revoke on
  other statuses and the panel surfaces that error.

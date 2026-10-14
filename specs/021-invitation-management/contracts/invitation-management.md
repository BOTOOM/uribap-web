# Contract: Household Invitation Management

Pinned API revision: `c0386230a7b04176e86eaa0984b99a4d90c327e5` on branch
`devin/1791942026-invitation-management` — **unmerged** (API pull request
[BOTOOM/uribap-api#160](https://github.com/BOTOOM/uribap-api/pull/160)). The Web contract file
`contracts/uribap-api.openapi.json` is a byte-for-byte copy of that branch's
`openapi/openapi.json`; this Web feature must deploy only after that API change is live.

## Endpoints consumed

- `GET /api/v1/households/{household_id}/invitations` → `200 InvitationPage`
  (`items: InvitationResponse[]`, `page_info`). Restricted to owner/admin members; the API returns
  a problem response for other roles.
- `POST /api/v1/households/{household_id}/invitations` → `202 InvitationCreatedResponse`. Reused
  for resend: posting `{ email }` of an expired/failed invitation renews it; a still-valid pending
  invitation for the same email is rejected (`409`).
- `DELETE /api/v1/households/{household_id}/invitations/{invitation_id}` → `204`. Revokes a
  pending invitation.

## `InvitationResponse` fields used

```yaml
id: uuid                    # revoke path parameter
email: string               # shown; reused as resend payload
requested_role: { enum: [admin, member] }
effective_status: { enum: [pending, expired, accepted, revoked] }
delivery: { enum: [sent, failed, existing_account, pending] , nullable }
expires_at: date-time
```

- `effective_status`: `pending` only while `expires_at > now` on the API; a `pending` row past
  expiry reports `expired`.
- `delivery`: outbox `sent`→`sent`, `failed`→`failed`, `suppressed`→`existing_account`,
  `pending`→`pending`, no outbox entry → `null` (rendered as “sin enviar”).

## BFF surface added

- `GET /api/households/{householdId}/invitations` → proxies the listing, same `{ code, detail }`
  error mapping as the existing route file.
- `DELETE /api/households/{householdId}/invitations/{invitationId}` → proxies revoke, returns
  `204` empty body on success.

Resend intentionally has no new BFF route: it POSTs `{ email }` to the existing
`POST /api/households/{householdId}/invitations` proxy.

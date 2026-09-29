# Analyze — ZITADEL Household Invitations

## Clarify gate

The user settled the API contract, copy, acceptance behavior, sequencing, and
verification scope. No additional clarification is required.

## Readiness review

- The API contract must be pinned only after the API feature is committed and pushed;
  this avoids guessing the contract revision.
- Invitation delivery status is API-authoritative and maps one-to-one to the four
  specified Spanish messages.
- The token is read before the auth check and nested safely inside the internal
  `returnTo` path; the existing `safeReturnTo` preserves its query.
- Pending invitation retrieval is independent of the existing `/me` membership
  request, so its failure can degrade to an empty list without blocking onboarding.
- The BFF mutation remains server-side and uses the existing authenticated request
  pattern; the client component handles only request state and navigation.
- Pending-list, token-return, API-error, and acceptance-error states are covered by
  focused unit/component tests.
- No authenticated browser, ZITADEL, Docker, Mailpit, or E2E check will be run, and
  convergence will say so explicitly.

## Decision

**Ready for implementation after API push.** No product decision remains unresolved.

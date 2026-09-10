# Spec Kit Analysis: OIDC BFF and Household Onboarding

**Feature**: `002-oidc-bff-onboarding`
**Date**: 2026-09-10
**Mode**: Read-only artifact analysis before implementation
**Inputs**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `traceability.md`, `tasks.md`, Web constitution, and `AGENTS.md`

## Verdict

**PASS — ready for implementation.** No critical or high-severity inconsistencies remain after the design corrections recorded before this analysis.

`converge` is intentionally a post-implementation phase in the required workflow (`... → analyze → implement → converge`). Its absence before implementation is expected; it will be produced after implementation and testing, not used to bypass this pre-code gate.

## Checks performed

| Check | Result | Evidence |
|---|---|---|
| Spec completeness | PASS | Three independently testable stories, 17 FRs, 9 buildable SCs, edge cases, entities, assumptions |
| Plan alignment | PASS | Auth.js/ZITADEL, server session, route boundary, API client, onboarding, permissions, Mailpit, and responsive gates are represented |
| Web contract coverage | PASS | Login, auth error, onboarding, household settings, invitation GET/POST split, health, Auth.js handler, server API client, browser security, env boundary |
| Task format | PASS | 52 unique IDs, all checkbox tasks include concrete paths, no sample placeholders |
| FR/SC traceability | PASS | `traceability.md` maps all FR-001–FR-017 and SC-001–SC-009 to tasks |
| Constitution alignment | PASS | API source of truth, server-first performance, secure cookies, accessible states, responsive/a11y, no token exposure, no Brevo local |
| Local identity boundary | PASS | Web consumes the API-owned ZITADEL/PostgreSQL/Mailpit stack and does not duplicate issuer setup |
| API/Web boundary | PASS | API is authoritative; server-only API client injects bearer; client components receive safe DTOs only |
| Invitation security | PASS | GET page and separate POST BFF route; raw token never enters public session/storage/props/logs |
| Open issues/placeholders | PASS | No `[NEEDS CLARIFICATION]`, `TODO`, route collision, or obsolete SWE references in feature artifacts |

## Resolved findings before analysis

1. Separated the Web invitation page (`GET /invitations/accept`) from the server BFF mutation (`POST /api/invitations/accept`) and API `POST /api/v1/invitations/accept`.
2. Added `updateHousehold(id, input, version)` to the server API client contract.
3. Made the API OpenAPI snapshot dependency explicit before Web generation.
4. Added the public Web `/api/health` contract/task for local readiness.
5. Added browser token/non-exposure and client-network bearer assertions.
6. Added API-owned identity Compose dependency and Mailpit evidence to the Web traceability matrix.

## Remaining implementation decisions

These are planned implementation choices, not unresolved specification ambiguities:

- Exact mature Auth.js package/version will be selected by pnpm and security/license gates.
- The ZITADEL PKCE client remains synthetic and local-only.
- Auth.js's encrypted server session shape will be finalized in the implementation while preserving the contract's no-token-exposure rules.
- `converge.md` will be written after code, tests, and quickstart validation assess the actual implementation.

## Metrics

- Functional requirements: 17; mapped: 17 (100%).
- Buildable success criteria: 9; mapped: 9 (100%).
- Web tasks: 52; unique IDs: 52; format violations: 0 after path normalization.
- Critical findings: 0.
- High findings: 0.
- Medium/low observations: 0 blocking; remaining items are implementation-time evidence gates.

## Gate decision

Product code MAY begin only after this analysis artifact is committed with the feature specs. All implementation tasks remain unchecked until their tests and quickstart evidence pass.

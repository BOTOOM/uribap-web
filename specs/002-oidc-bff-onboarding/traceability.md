# Traceability: OIDC BFF and Household Onboarding

This matrix maps every functional requirement and buildable success criterion to implementation/test tasks. It is reviewed before implementation and again during convergence.

## Functional requirements

| Requirement | Tasks | Evidence target |
|---|---|---|
| FR-001 ZITADEL OIDC/PKCE | T006, T011–T012, T018 | Auth config and local callback tests |
| FR-002 server-side Auth.js BFF | T007, T011–T014, T019 | Encrypted session and route tests |
| FR-003 no browser token exposure | T007–T010, T047 | Browser storage/props/network assertions |
| FR-004 protected routes | T009, T014–T015, T018–T019, T024 | Redirect and expiry E2E |
| FR-005 server-only API bearer injection | T008, T013, T047 | Server client and network assertions |
| FR-006 explicit state coverage | T008, T020, T026, T031, T034–T038 | Component/E2E state tests |
| FR-007 no-membership onboarding gate | T009, T027, T032–T033 | Route and onboarding E2E |
| FR-008 onboarding form/API authority | T026, T028–T033 | Schema/action/authoritative response tests |
| FR-009 active household selection | T027, T032–T033, T043 | Context and session refresh tests |
| FR-010 role-driven management | T034–T036, T039–T041 | Permission UI/E2E |
| FR-011 invitation acceptance | T037, T042–T043 | Server POST BFF and Mailpit E2E |
| FR-012 logout/federated logout | T019, T023 | Session and provider logout tests |
| FR-013 environment separation | T002, T016, T047 | Env validation and secret scan |
| FR-014 generated OpenAPI client | T003, T044 | API snapshot/client generation check |
| FR-015 accessible responsive identity flows | T021, T029, T038, T048 | Axe/keyboard/reduced-motion/viewports |
| FR-016 local ZITADEL/PostgreSQL/Mailpit/no Brevo | T004, T045–T049 | Local identity fixtures and stack tests |
| FR-017 no sensitive logging | T007–T010, T016, T047 | Session/network/log redaction tests |

## Buildable success criteria

| Criterion | Tasks | Evidence target |
|---|---|---|
| SC-001 protected route privacy | T009, T018, T022–T024 | Redirect/private-content assertions |
| SC-002 browser token non-exposure | T007, T010, T047 | Storage/HTML/props/network checks |
| SC-003 local login/onboarding flow | T018, T026–T033, T048–T049 | Deterministic Playwright flow |
| SC-004 distinct permission/recovery states | T008, T020, T026, T034–T038 | Accessible state assertions |
| SC-005 required viewports/focus | T021, T029, T038, T048 | 375/768/1024/1440 evidence |
| SC-006 refresh/logout safety | T019, T023–T024 | Expiry/logout E2E |
| SC-007 invitation/permission/Mailpit | T034–T043, T049 | Owner/admin/member and email evidence |
| SC-008 generated client determinism | T003, T044 | `pnpm api:check` |
| SC-009 local identity readiness | T045–T049, T051 | ZITADEL/PostgreSQL/Mailpit/API/Web readiness |

## Cross-repository dependency

Web T003/T044 and identity E2E depend on API T027/T036/T046 publishing the canonical OpenAPI snapshot and API T047–T050 providing the canonical local identity Compose stack. Web `GET /api/health` is the public Web readiness route used by local Docker checks.

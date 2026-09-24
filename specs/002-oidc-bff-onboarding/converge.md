# Convergence Report: OIDC BFF and Household Onboarding

**Date**: 2026-09-10
**Status**: In progress — remaining tasks appended to `tasks.md`

## Verified implementation

- Auth.js ZITADEL provider, PKCE callback, encrypted session cookie boundary, middleware/layout protection, server-only API client, onboarding BFF, invitation acceptance BFF, household settings/member list, invitation form, and Web health route are implemented.
- Real local PKCE login passed with a synthetic ZITADEL user; the JWT access token was validated by API after configuring the local app to issue JWT access tokens.
- Onboarding created a household through the BFF/API and reached `/plan`; browser cookies/storage/client requests contained no provider token or Authorization header.
- Mailpit invitation delivery was verified from the household settings UI.
- Lint, TypeScript, Vitest, build, responsive/axe/performance Playwright suite, audit, license, bundle budget, and Docker health gates pass.

## Remaining gaps

1. Auth.js refresh-rotation and federated logout need dedicated implementation/E2E coverage; only initial login/logout boundary is exercised.
2. Owner/admin/member role controls, active-household switching, invitation acceptance with a second user, and stale/conflict UI need complete interaction coverage.
3. Web unit/component/auth state tests and Mailpit-specific Playwright assertions are still thinner than the final contract requires.
4. Dockerized Web identity execution needs a documented server-only env overlay; host-based local flow is verified.
5. The Next.js 16 `middleware` deprecation warning should be migrated to `proxy` before release.

The feature remains `Ready for implementation`/in progress and must not be considered converged until the appended tasks pass.

## Follow-up resolution

- T057 was resolved after the initial convergence report: the Next.js route guard now uses `src/proxy.ts`, the deprecated `src/middleware.ts` was removed, and the production build no longer emits the middleware warning.

## Deployment Readiness and Dedicated Login Amendment — evidence on 2026-09-24

T060–T064 are implemented and their focused regression/static/build evidence is recorded in `quickstart.md`. The complete upstream Login V2 image builds from the pinned source with a presentation-only overlay and documented per-project deployment boundary. The `/uribap/` local health route returns 200; desktop/mobile captures cover 375, 768, 1024, and 1440 pixels, with no overflow and zero axe violations. Refresh, session cookie chunking, proxy propagation, logout CSRF/cookie clearing, safe return paths, and public session token exclusion have synthetic unit coverage.

T065 remains open: the actual local Web OIDC application was not created/configured, so authorization-code + PKCE, verified profile via UserInfo, real refresh/logout, and password reset/verification/MFA were not exercised. The ZITADEL console local Admin API attempt to assign the dedicated service role returned 401; no app or service PAT was issued. No production endpoint, global identity settings, or external SMTP was used. T066 remains with the lead for Devin Review/PR management; historical feature tasks are unchanged and remain in progress.

## Devin Review follow-up — evidence on 2026-09-24

T067–T070 are implemented and focused evidence is in `quickstart.md`: 52 Auth unit tests, Web lint/typecheck, overlay seam tests, the isolated 7-test CI-like public E2E run with no inherited secret, upstream lint on only three TSX files, and runtime asset 200s from the existing Login image. No full suites/builds or visual re-review were repeated. The unresolved local OIDC/email flows remain NOT RUN; PR review/merge remains with the lead.

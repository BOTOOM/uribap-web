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

# Feature Specification: Vercel Hardening and Operations Runbook

**Feature Branch**: `011-deployment`  **Status**: Ready for implementation

## User Stories

- **US1 (P1)**: An operator deploys the Web app to Vercel using a documented
  environment-variable contract — which vars are public, server-only, required
  for auth, and safe local defaults — without exposing secrets to the browser.
- **US2 (P1)**: Every page and BFF response carries baseline security headers
  so the app is safe to serve publicly.
- **US3 (P1)**: The runbook documents preview vs. production behavior, secret
  rotation, the health endpoint, and the no-deploy boundary of this phase.
- **US4 (P2)**: Local `pnpm dev` / Docker flows keep working unchanged.

## Requirements

- **FR-001**: `next.config.ts` MUST set response headers on all routes:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive
  `Permissions-Policy`, and a Content-Security-Policy that allows Next
  hydration (`script-src 'self' 'unsafe-inline'`), styles, images, and
  same-origin BFF fetches while denying framing (`frame-ancestors 'none'`).
- **FR-002**: `.env.example` MUST document every env var the app consumes —
  `NEXT_PUBLIC_API_BASE_URL`, `URIBAP_API_INTERNAL_URL`, `AUTH_SECRET`,
  `AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET`, `AUTH_ZITADEL_ISSUER`,
  `AUTH_TRUST_HOST` — with placeholders only, never real values.
- **FR-003**: `docs/operations/vercel.md` MUST document the env-var contract,
  preview vs. production, secret rotation guidance, `/api/health` semantics,
  headers rationale, and the explicit no-deploy boundary.
- **FR-004**: No token, cookie, or provider secret may reach the browser; the
  CSP MUST NOT permit cross-origin API calls (BFF same-origin only).
- **FR-005**: Existing pages, BFF routes, and e2e/a11y flows stay green.

## Acceptance

- Response headers verifiable on any page and BFF route (unit-tested config).
- `.env.example` parseable with placeholder values; fresh `pnpm dev` boots.
- The runbook lists every env var and the release checklist without deploying.
- All gates in `quickstart.md` pass.

## Edge cases

- Auth redirect flows (ZITADEL) rely on top-level navigation, not
  `connect-src` — CSP keeps `connect-src 'self'` and login keeps working.
- `frame-ancestors 'none'` replaces the need for permissive framing; no part
  of the app is embedded.

## Measurable outcomes

- Header config unit test green; lint/typecheck/test/e2e/a11y/build green;
  `pnpm audit --prod` and license checks clean.

# Converge: Vercel Hardening and Operations Runbook

## Scope delivered

- `next.config.ts` `headers()` — baseline headers on every route:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and a CSP
  that confines browser work to same-origin (`connect-src 'self'`,
  `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`) while
  allowing Next hydration (`script-src 'self' 'unsafe-inline'`).
- `tests/unit/security-headers.test.ts` — asserts the route source, header
  keys, and the CSP directives.
- `docs/operations/vercel.md` — env-var contract (public vs server-only),
  preview vs. production, `AUTH_SECRET`/ZITADEL rotation, `/api/health`
  probe, headers rationale, and the no-deploy release checklist.
- `.env.example` verified in parity with `src/lib/config/env.ts` — all seven
  consumed vars already documented with placeholders.

## Verification

All gates in `quickstart.md` pass: `api:check`, `lint`, `typecheck`,
`pnpm test` (59 tests / 21 files), `build`, `licenses`, `performance`,
`audit`; e2e suite green with opt-in specs skipped.

## Design notes

- `connect-src 'self'` hardens the BFF boundary: the browser can only call
  same-origin `/api/*` routes, so no provider token or API credential can be
  used cross-origin.
- No `vercel.json` needed — Next's canonical `headers()` covers Vercel and
  the standalone Docker path identically.
- Nonce-based CSP is documented as deferred follow-up; `'unsafe-inline'` for
  scripts is the pragmatic Next baseline.

## Remaining work

None for Web phase 011. Actual Vercel deployment stays out of scope.

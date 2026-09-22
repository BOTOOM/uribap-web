# Plan: Vercel Hardening and Operations Runbook

## Architecture

- `next.config.ts` `headers()` — static baseline on `/(.*)`:
  `nosniff`, `DENY`, `strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera/microphone/geolocation off), and a CSP of
  `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'
  'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';
  frame-ancestors 'none'; form-action 'self'; base-uri 'self'`.
- `.env.example` — placeholders-only parity with `src/lib/config/env.ts`.
- `docs/operations/vercel.md` — env table (public vs server-only), preview vs
  production, AUTH_SECRET rotation, `/api/health` probe, headers rationale,
  no-deploy boundary.
- Unit test — imports the config, asserts the header entries exist.

## Model

`gpt-5-6-sol-high` implementation; `gpt-5-6-terra-high` header/runbook review.

## Testing

- Unit test for `headers()` entries.
- Full gates: `api:check`, lint, typecheck, test, e2e, a11y, build, audit,
  licenses, performance.

## Risks

- CSP too strict → break Next hydration/ZITADEL redirect → keep
  `script-src 'unsafe-inline'` (Next inline payloads), navigation-based auth.
- Header regex in `headers()` misapplied → single `/(.*)` source, unit test
  asserts keys.

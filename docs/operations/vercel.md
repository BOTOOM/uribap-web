# Vercel Operations Runbook

This document describes how the Web app is configured and operated on Vercel.
Deployment itself is out of scope for this phase — this runbook is the
contract a future deploy must satisfy.

## Build

- Vercel auto-detects Next.js; `pnpm` is the package manager (pinned via
  `packageManager` in `package.json`). No `vercel.json` is required —
  `next.config.ts` owns output mode (`standalone`), security headers, and
  typed routes.
- The repository `Dockerfile` stays as the container fallback (standalone
  output, non-root `node` user); both paths run the same build.

## Environment contract

| Variable | Scope | Purpose | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | browser | Public API base for direct client use, the MCP URL shown in `/settings/agentes`, and the CSP `connect-src` origin | Production: `https://uribap-api.edwardiaz.dev/api/v1`; **build-time**: it is inlined by `next build` (Dockerfile `ARG` — pass it as a Coolify build arg, not only runtime env) |
| `URIBAP_API_INTERNAL_URL` | server-only | BFF route handlers' upstream | Production: `https://uribap-api.edwardiaz.dev/api/v1`; never exposed to the browser |
| `AUTH_SECRET` | server-only | NextAuth JWT/session encryption | ≥32 chars, generated per environment |
| `AUTH_URL` | server-only | Canonical application origin for same-origin federated logout | Production: `https://uribap.edwardiaz.dev` |
| `AUTH_ZITADEL_ID` / `AUTH_ZITADEL_SECRET` | server-only | OIDC client credentials | ZITADEL app credentials; secret storage |
| `AUTH_ZITADEL_ISSUER` | server-only | OIDC issuer URL | Production: `https://zitadel.edwardiaz.dev` |
| `AUTH_TRUST_HOST` | server-only | Trust `X-Forwarded-Host` | `true` behind Vercel/proxy |

Rules:

- Only `NEXT_PUBLIC_*` vars reach the browser bundle. `serverEnv` values are
  consumed exclusively by Server Components and `/api/*` BFF route handlers.
- `URIBAP_API_INTERNAL_URL` is runtime-only and may point at internal service
  DNS (e.g. `http://uribap-api:8000/api/v1` on the Coolify network) while
  `NEXT_PUBLIC_API_BASE_URL` stays the public origin.
- `.env.example` documents the full list with placeholders — real values live
  in Vercel's environment variable storage (and local `.env.local`, git-ignored).
- The BFF derives the active household from `/me`; no internal household or
  tenant id needs to be exposed to the client.

## Preview vs. production

- Preview deployments: same env contract, pointing at a staging API and a
  preview ZITADEL client if needed. `AUTH_TRUST_HOST=true` is required because
  Vercel serves previews behind its proxy.
- Production: `URIBAP_API_INTERNAL_URL` should reach the API over the private
  path when available; otherwise the public API origin with TLS.

## Shared ZITADEL and Uribap Login V2

The branded Login V2 presentation is a separate Coolify Git Compose resource from the Web repository at
`identity/login/compose.coolify.yml`, built with the repository root as context and
`identity/login/Dockerfile`. Its labels own the `zitadel.edwardiaz.dev/uribap` path; do not assign
the service a whole-host domain in Coolify.

Configure `URIBAP_LOGIN_PAT` as a runtime secret on this service only. It must belong to the
dedicated `IAM_LOGIN_CLIENT` service user, never an administrator. The OAuth client secret remains
in the main Web application's Vercel environment as `AUTH_ZITADEL_SECRET`; it is not the Login V2
PAT. Deploy the service and verify `https://zitadel.edwardiaz.dev/uribap/healthy` before changing
any ZITADEL setting. Then change only the **Uribap Web project's per-application** custom Login V2
base URI to `https://zitadel.edwardiaz.dev/uribap/`. Leave the shared instance base URI, global
branding, default `/ui/v2/login` console route, and every other project's configuration untouched.

Main Web Vercel values remain:

- `AUTH_ZITADEL_ISSUER=https://zitadel.edwardiaz.dev`
- `AUTH_URL=https://uribap.edwardiaz.dev`
- callback: `https://uribap.edwardiaz.dev/api/auth/callback/zitadel`
- `NEXT_PUBLIC_API_BASE_URL` and `URIBAP_API_INTERNAL_URL`:
  `https://uribap-api.edwardiaz.dev/api/v1`

The Login V2 image is built from the complete upstream ZITADEL v4.16.0 workspace at commit
`02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe`, including the frozen pnpm lockfile and client/proto
generation. Review upgrades as a complete
workspace and preserve its license; do not copy only `apps/login` or install unpinned client/proto
packages. No build-time identity credentials are used.

ZITADEL identity-email text is organization-scoped under **Organization Settings → Message Texts**;
appearance is a separate **Branding** setting. Project/client configuration remains separate from
the shared issuer and other projects. Uribap API mail content is separately constructed as
`text/plain` from API template data; Brevo is only the SMTP transport and `EMAIL_DELIVERY_ENABLED`
remains `false`. This custom login adds no email-template editor or delivery feature.

## Health

- `GET /api/health` — lightweight liveness for the app process; returns JSON.
  Use it for uptime checks; deep readiness depends on the API's own
  `/api/v1/health/ready`.

## Security headers

`next.config.ts` sets on every route:

- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src
  'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src
  'self' <api-origin>; frame-ancestors 'none'; form-action 'self'; base-uri
  'self'` — where `<api-origin>` is derived from `NEXT_PUBLIC_API_BASE_URL`
  at boot.
  - `connect-src` confines browser fetches to the same-origin BFF plus the
    single configured API origin (used by the `/foundation/api-state`
    diagnostic); no other cross-origin target is allowed.
  - `script-src 'unsafe-inline'` is the pragmatic Next baseline (inline
    hydration payloads); a nonce-based CSP is deferred follow-up work.
- HSTS is owned by the TLS-terminating edge, not the app.

## Secret rotation

- `AUTH_SECRET`: rotate via a new env var value → redeploy; active sessions
  invalidate (acceptable, sessions re-establish via ZITADEL).
- `AUTH_ZITADEL_SECRET`: rotate in ZITADEL first, update the env var, redeploy.

## Release checklist (no deploy performed in this phase)

1. `pnpm api:check` clean — contract pinned to the deployed API revision.
2. Env vars above configured in the Vercel project (Production + Preview).
3. `pnpm build` green; headers visible via `curl -I` on the deployment.
4. `/api/health` returns 200 on the deployment.

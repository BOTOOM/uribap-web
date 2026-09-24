# Quickstart: OIDC BFF and Household Onboarding

All local tests use synthetic identities and the canonical identity stack from `../api/identity`. No Brevo, real SMTP, production issuer, or real credentials are allowed.

## Prerequisites

- Docker Engine and Compose plugin.
- Node.js 24 and pnpm 10.
- API repository available at `../api`.
- Disposable local ZITADEL client/application seeded by the API identity script.

## 1. Start the canonical local identity stack

From the API repository:

```bash
cd ../api/identity
cp .env.identity.example .env.identity
# Fill only disposable local values in the ignored file.
docker compose -p uribap-identity --env-file .env.identity -f compose.identity.yml up -d --wait
```

Expected endpoints:

- ZITADEL: `http://localhost:8080`.
- Mailpit: `http://localhost:8025`.
- API: `http://localhost:8010`.

## 2. Configure Web local env

From the Web repository:

```bash
cp .env.example .env.local
# Set AUTH_SECRET and local ZITADEL/API values only in .env.local.
# Keep client secrets server-only and never commit the file.
```

The local callback URI must match the ZITADEL PKCE application:

```text
http://localhost:3000/api/auth/callback/zitadel
```

## 3. Run Web checks

```bash
pnpm lint
pnpm typecheck
pnpm api:check
pnpm test
pnpm build
```

## 4. Run browser identity tests

```bash
pnpm test:e2e --grep @identity
pnpm test:a11y --grep @identity
```

The identity suite must cover:

- unauthenticated protected-route redirect;
- ZITADEL authorization-code + PKCE callback;
- safe session shape and no token exposure in `document.cookie`, storage, HTML, or client props;
- onboarding create-household flow;
- owner/admin/member permission states;
- invitation email in Mailpit and one-time acceptance;
- refresh/session expiry and local/federated logout;
- responsive 375/768/1024/1440 and reduced-motion behavior.

## Observed validation on 2026-09-10

- Auth.js `5.0.0-beta.32` with local ZITADEL PKCE application; callback `http://localhost:3000/api/auth/callback/zitadel`.
- Real local PKCE login passed and reached `/onboarding`; after API household creation it reached `/plan`.
- Browser security assertions: no access/refresh/id token cookie, empty localStorage, and zero client-side Authorization headers.
- Web lint, typecheck, 8 Vitest tests, and production build passed.
- Playwright full suite: 9 passed and 1 explicit identity skip without credentials; identity E2E passed when synthetic credentials were supplied.
- Web Docker `/api/health` 200 and container healthy; API Docker `/health/identity` 200.
- Invitation UI created a synthetic invitation; Mailpit contained the expected recipient and subject.

## 5. Run delivery gates

```bash
pnpm test:a11y
pnpm audit --audit-level=high
pnpm licenses:check
pnpm performance:check
pnpm build
docker compose up -d --build
docker compose ps
```

A missing identity dependency is `NOT RUN`, never a silent pass. Record skipped flows and unresolved task IDs in the testing report.

## 6. Stop safely

```bash
cd ../api/identity
docker compose -p uribap-identity -f compose.identity.yml logs > identity-test.log
docker compose -p uribap-identity -f compose.identity.yml down
```

This preserves local volumes. A full volume reset requires explicit approval and is never part of the automated skill.

## Deployment Readiness and Dedicated Login Amendment — observed validation on 2026-09-24

| Gate | Result | Evidence |
|---|---|---|
| `pnpm exec vitest run tests/unit/auth` | PASS | 41 passed: provider Basic/PKCE checks, API profile DTO/verification, token rotation/failure, HTTPS chunked cookie, Proxy renewal, origin-checked logout, safe return paths |
| `node --test identity/login/*.test.mjs` | PASS | 2 passed: exact upstream seam patch and fail-closed drift guard preserve login flow files |
| `pnpm lint` / `pnpm typecheck` / `pnpm api:check` | PASS | generated API schema unchanged |
| `pnpm test` | PASS | 117 passed across 28 files |
| `pnpm build` | PASS | Next.js 16.3.3 production build completed using synthetic/local env overrides |
| `pnpm test:e2e` | PASS / SKIP | 8 passed, 9 explicit identity-gated skips because no local Web test client credentials were provided to the runner |
| `pnpm test:a11y` | PASS | 1 passed |
| `pnpm audit --audit-level=high` | PASS | no known vulnerabilities |
| `pnpm licenses:check` | PASS | 14 license families; reviewed transitive LGPL libvips exception only |
| `pnpm performance:check` | PASS | client chunk 935,379 / 2,000,000 bytes |
| Custom Login V2 Docker build | PASS | complete upstream workspace/proto/client at commit `02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe`; Node 24 multiarch digest pinned |
| Local custom `/uribap/healthy` | PASS | 200; custom container healthy on `uribap-identity` network |
| Login V2 responsive/axe | PASS | screenshots `/tmp/uribap-custom-login-{375,768,1024,1440}.png`; no overflow at all four widths; mobile/desktop axe had 0 violations; reduced motion active; keyboard reached visible skip link |
| Local authorization-code callback, verified API profile, refresh/logout, MFA/reset/email | NOT RUN | A test Web OIDC app was created through local Console UI, but ZITADEL still routes authorization to `/ui/v2/login/loginname`; after `ApplicationService/UpdateApplication` returned 200, reloading showed Refresh Token and Use new Login UI/custom base unset. No user callback/profile `/me`/refresh/logout/password/email flow was run. No production issuer or SMTP was contacted. |

`docker compose -f compose.login.coolify.yml config --quiet` passed with a synthetic variable. The local ZITADEL/Mailpit stack remained healthy. For visual/assets testing only, a local Login V2 container read the canonical bootstrap login PAT from its volume read-only; it was never used for administration. A synthetic `Uribap Login Readiness` project, unprivileged `IAM_LOGIN_CLIENT` service account (no role/PAT), and Web OIDC app were created through Console UI. The app's JWT/profile token settings persisted; Refresh Token/custom Login V2 base settings did not persist after reload. No shared-instance branding, instance base URI, default Login V2 route, or other project settings were changed.

The local Web dev server remains on port 3000 with the new local test client and an ephemeral Auth.js secret; API UserInfo test server runs at 8011, and `uribap-auth-tests-db` remains on loopback port 55433. A mapped UserInfo probe with an invalid synthetic bearer returned 401 through the API container, not 503, but no valid JWT `/me` was tested. Full live identity acceptance remains open; the client, mocks, asset checks and public authorization request do not imply a completed PKCE callback/profile/refresh/logout pass.

## Devin Review follow-up — verification on 2026-09-24

| Gate | Result | Evidence |
|---|---|---|
| `pnpm exec vitest run tests/unit/auth` | PASS | 52 passed, including racing failed/successful session responses in both cookie-application orders, GET/POST guards, signout preservation, API-authoritative onboarding, Spanish `ui_locales`, and strict 401/503 paths |
| `pnpm lint` / `pnpm typecheck` | PASS | ran after the review batch |
| `node --test identity/login/*.test.mjs` | PASS | 2 overlay seam tests |
| Upstream ESLint | PASS | only replaced/new Login TSX: login layout, `logo.tsx`, `uribap-brand.tsx`, under the pinned ZITADEL workspace config |
| CI-like public Playwright | PASS | 7 passed (`foundation`, `api-state`, `a11y`) with runner `AUTH_SECRET` unset, `CI=1`, alternate port 3001 and `/api/health` readiness; port 3000 was left untouched |
| Running custom Login assets | PASS | `/uribap/loginname` 200; CSS 1/1, JS 21/21, fonts 3/3 returned 200; zero page or console errors |

The temporary port-3001 check server was started with a fresh random session secret and left running. `next start` emitted its standalone-output warning, but the health endpoint returned 200 and the 7 public tests passed. The custom Login asset probe used the already built `uribap-login:local` container; no image rebuild, screenshots, full Web suite, or audit rerun was performed. The pinned upstream checkout in `/tmp` was installed with `pnpm install --frozen-lockfile` solely to run targeted lint; neither repository lockfile changed.

The local bootstrap human admin authenticated in Console UI and created the synthetic project/app; the separate `IAM_LOGIN_CLIENT` account remains unprivileged with no PAT. The earlier scripted same-origin `POST /admin/v1/members` using a Console session bearer returned 401 (response body not captured); no further admin API call or login-client PAT administration was attempted. Existing ignored `.env.local` had local client credential keys, but values were not enumerated or mapped. Session-race recovery only retains failed-response session cookies when a session cookie was present and the returned session has no user; those cookies alone never authenticate, API expiry/validation remains authoritative, and explicit signout/logout still clear them. No single-flight guarantee is claimed.

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

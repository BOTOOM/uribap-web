# Implementation Plan: OIDC BFF and Household Onboarding

**Branch**: `002-oidc-bff-onboarding` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification for ZITADEL OIDC/PKCE, Auth.js BFF sessions, protected routes, onboarding, memberships, and invitations.

## Summary

Add the Web authentication boundary and first household onboarding experience on top of the API feature `002-identity-households`. Auth.js will use the built-in ZITADEL provider and authorization-code + PKCE flow. Server-only callbacks will retain provider access/refresh material inside an encrypted HttpOnly session boundary, while browser-facing session data contains only safe user and membership summaries. Protected routes will use server session checks and a middleware/route boundary; server API helpers will inject bearer tokens without exposing them to client components.

The Web will provide accessible login, onboarding, active-household selection, membership/invitation management, and explicit permission/error/recovery states. It will consume the API's generated OpenAPI client and never duplicate household authorization or calculations.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 24 LTS-compatible toolchain, Next.js 16 App Router, React 19

**Primary Dependencies**: Auth.js/next-auth ZITADEL provider at a compatible maintained release, `openapi-fetch`, generated `openapi-typescript` schema, React Hook Form, Zod, Radix primitives, TanStack Query only where client interaction requires it, Playwright, Vitest, axe-core

**Storage**: No browser storage for tokens; encrypted server-side Auth.js session cookie; API/PostgreSQL owns users, memberships, households, invitations, and audit state

**Testing**: Vitest/Testing Library for auth/onboarding state boundaries, Playwright against local ZITADEL/PostgreSQL/Mailpit/API, axe accessibility, responsive viewports 375/768/1024/1440, security assertions for cookie/localStorage/props, OpenAPI generation/check, production build, Docker health, audit/license/performance gates

**Target Platform**: Vercel production and Docker/Node local container; local identity stack at `http://localhost:8080`, Mailpit at `http://localhost:8025`, API at `http://localhost:8010`

**Project Type**: Authenticated Next.js product application with server-side BFF boundary

**Performance Goals**: Protected route server response and onboarding shell remain within the foundation budget; no client access-token exposure; LCP under 2.5s, INP under 200ms, CLS under 0.1 on the feature profile; no auth waterfalls caused by duplicated session/API calls

**Constraints**: Server Components by default; secrets server-only; no localStorage tokens; API is authoritative; no open redirects; WCAG 2.2 AA; Spanish-neutral copy; no food/product imagery; local tests never use Brevo or real SMTP; dependency release-age/security gates remain active

**Scale/Scope**: Initial onboarding and household administration for a two-person household; multiple memberships and role states supported; downstream recipe/inventory/planning routes remain outside this feature

## Constitution Check

- **API source of truth**: PASS. Household, role, invitation, and tenant decisions come from API responses; Web only renders and submits them.
- **Server-first performance**: PASS. Auth/session/API token exchange is server-side; client components are limited to forms, menus, and interactive states.
- **Accessible completion**: PASS. Login, onboarding, settings, dialog, form, error, permission, and reduced-motion requirements are explicit and tested.
- **Contract/state coverage**: PASS. The generated client is regenerated from the API snapshot and all relevant auth/API states are distinct.
- **Security**: PASS. Auth.js encrypted HttpOnly cookies protect server session material; browser JavaScript never receives access/refresh tokens or secrets.
- **Resource/motion discipline**: PASS. No new global store or animation runtime; auth flow uses simple transitions with reduced-motion fallback.

## Research Decisions

See [research.md](./research.md). The central decisions are:

1. Use Auth.js's built-in ZITADEL provider with server-side callbacks and PKCE rather than hand-rolling OAuth endpoints.
2. Keep access/refresh data only in the encrypted server session and expose a minimal browser session shape.
3. Use server-only API helpers for bearer injection; client components call route actions/handlers rather than reading tokens.
4. Protect app routes with a server auth boundary and route-level active-household checks; middleware is a fast redirect, not the authorization source.
5. Make API `401`, `403`, `409`, `422`, and `503` states explicit UI states with recovery actions.
6. Reuse the API repository's canonical local identity Compose stack; Web quickstart never starts a second identity provider.

## Model Assignment

- **Primary**: `gpt-5-6-luna-high` for UI/auth architecture and interaction hierarchy.
- **Implementation**: `gpt-5-6-sol-high` for Next.js/Auth.js, route boundaries, forms, generated client, and tests.
- **Reviewer**: `gpt-5-6-terra-high` for OIDC/PKCE, cookie exposure, route protection, accessibility, and performance.
- **Artifact analyst**: `glm-5-3-max` for long-context spec/plan/tasks consistency.
- **Routine fixer**: `swe-2-high` for bounded type/lint/test corrections; `swe-2-max` for bounded multi-file fixes.
- **Escalation**: `kimi-k3-max` only for explicit cross-repo artifact review after normal analysis cannot resolve a material conflict.

## Project Structure

### Documentation (this feature)

```text
specs/002-oidc-bff-onboarding/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── traceability.md
├── analyze.md
├── converge.md
├── contracts/
│   └── oidc-bff-onboarding.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── plan/page.tsx
│   │   └── settings/household/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── health/route.ts
│   │   └── invitations/accept/route.ts
│   ├── auth-error/page.tsx
│   └── (public)/invitations/accept/page.tsx
├── components/
│   ├── auth/
│   ├── household/
│   ├── states/
│   └── ui/
├── features/
│   ├── auth/
│   └── households/
├── lib/
│   ├── api/
│   │   ├── server-client.ts
│   │   └── generated/schema.ts
│   ├── auth/
│   │   ├── auth.ts
│   │   ├── callbacks.ts
│   │   └── session.ts
│   └── config/env.ts
└── middleware.ts

contracts/
└── uribap-api.openapi.json

e2e/
├── auth.spec.ts
├── onboarding.spec.ts
├── household-permissions.spec.ts
├── invitation.spec.ts
└── security.spec.ts

tests/
├── unit/auth/
├── component/auth/
├── component/households/
└── accessibility/

identity/README.md  # points to ../api/identity canonical stack
```

**Structure Decision**: Keep Auth.js configuration under `src/lib/auth`, route handler under the App Router API path, server-only API access under `src/lib/api/server-client.ts`, and user-facing household features under feature folders. The Web repo references the API repo's canonical identity Compose stack instead of duplicating ZITADEL configuration.

## Implementation Phases

### Phase 0 — Research and contract design

- Verify compatible Auth.js/ZITADEL provider release and callback behavior.
- Define browser/server session shape, route protection, environment contract, and API client boundaries.
- Complete Web contract, state matrix, and quickstart.

### Phase 1 — Foundational BFF boundary

- Add dependency/configuration, Auth.js provider, callback route, secure session shape, server API client, route protection, login/logout/error pages, and unit/security tests.

### Phase 2 — Onboarding (User Story 2)

- Add onboarding form, API mutation, active-household context, redirect rules, validation/conflict/unavailable states, and responsive/a11y tests. The onboarding route obtains current memberships from server-side `/me`; session snapshots are not authorization authority.

### Phase 3 — Member and invitation management (User Story 3)

- Add household settings/member list/role controls/invitation forms/acceptance route and permission-driven UI states.

### Phase 4 — Local identity E2E and release gates

- Connect Playwright to the canonical API identity Compose stack, assert PKCE/login/refresh/logout/cookies/Mailpit, regenerate OpenAPI client, run accessibility/responsive/performance/audit/build/Docker gates, and document skipped flows.

## Complexity Tracking

No constitution violations. Auth.js is used as the existing governed BFF boundary. No global client store, browser token storage, duplicate identity provider, or custom OAuth protocol is introduced.

## Deployment Readiness and Dedicated Login Amendment

Architecture: keep the application on Vercel and add an independently built Login V2 presentation container on Coolify. The latter routes only `https://zitadel.edwardiaz.dev/uribap/` (including its assets and actions). Set only Uribap Web's per-application custom Login V2 base URI to that path. Keep global `/ui/v2/login/`, the shared issuer, and all other project settings untouched. A dedicated IAM_LOGIN_CLIENT service user supplies a runtime-only PAT; it is not a project-administration credential.

Build the complete upstream workspace at ZITADEL v4.16.0 commit `02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe` with its own frozen pnpm lockfile, client and proto generators. Maintain a small presentation overlay under `identity/login/`, not an unversioned copy of apps/login or a hand-written authentication protocol. Patch application layout and logo, add Uribap CSS and a card class, and preserve upstream validation/actions/forms/policies. Assert replacement seams so upstream drift fails the build. Keep the upstream license in the runtime image, use a non-root runtime and multistage Docker build. No generated upstream workspace is committed. Main Web TypeScript/lint checks exclude the separately compiled overlay; it receives its own upstream build checks.

Visual decisions: Operate mode for a household member returning to plan meals, pantry and shared preparation. Preserve the existing warm neutral background, terracotta accent, dark brown text, Newsreader headings, Manrope controls, restrained surfaces and home/table brand mark. A spacious desktop brand panel accompanies the active form; mobile foregrounds the form without hiding controls. No food imagery, gradients, invented metrics or new visual language. Retain language/theme controls and accessible focus, error, pending and reduced-motion states. The public /login page retains its current structure with user-facing copy and safe return paths.

Auth.js: explicitly configure `client_secret_basic`, checks `pkce`, `state`, `nonce`, and `ui_locales=es` while retaining the language chooser. Refresh uses RFC-compliant form-encoded Basic credentials, timeout and no redirects. Validate the refresh response shape; missing refresh credentials or a failed refresh invalidates the session. API user projection uses generated `CurrentUserResponse`, including `email_verified`. Playwright starts the proxy-protected E2E server with an ephemeral session secret when the parent CI environment has none and polls the public Web health route.

Session boundary: Next.js Proxy invokes the existing Auth.js session handler internally, forwards Auth.js Set-Cookie headers unchanged to the browser, and merges those encrypted cookie updates into downstream request cookies. It does not reinvent JWT encryption or expose access tokens in custom headers. A failed refresh writes an HttpOnly HMAC marker bound to that encrypted refresh generation; the Proxy rejects and short-circuits only that generation, while a successful token rotation or a fresh authorization-code callback starts a different generation. Failed refresh responses never overwrite Auth.js session chunks, preserving a concurrent successful refresh. Federated logout clears session and pending authorization cookies and writes an HttpOnly HMAC fence bound to the timestamp and the logged-out Auth.js session epoch. A refresh keeps that epoch and remains rejected even when it finishes late; a new authorization-code login rotates it, so coarse ID-token `auth_time` precision cannot strand a same-second reauthentication. Earlier authentication times remain rejected. A login after logout explicitly uses `prompt=login` and `max_age=0`. These stateless fences are shared across serverless instances, store no provider tokens, and keep access/refresh tokens in the encrypted Auth.js cookie only. Public `/api/auth/session` responses remove internal fingerprints, epochs and timestamps. Server API reads explicitly select HTTPS secure cookies. Federated logout requires the configured canonical application origin and redirects with 303.

Tests first: callback DTO mapping, validated ID-token `auth_time` and authentication-generation rotation, Basic refresh encoding and credential non-disclosure, invalid refresh response/expired session, explicit provider checks, encrypted secure-cookie/chunk handling, Proxy request and response cookie propagation, repeated failed-refresh short-circuit, concurrent refresh preservation, same-second reauthentication after logout, direct server-client rejection of fenced generations, failed-session invitation redirects, same-origin/chunked logout, safe login destinations. Preserve server/API authority on membership and do not swallow Next redirects as generic API failures.

Gate: focused Vitest/static tests and both application/custom-login builds; then one final repository gate and local browser flows using only disposable ZITADEL/PostgreSQL/Mailpit. Main app callbacks remain `/api/auth/callback/zitadel`, issuer stays environment-driven, and no database/public API contract changes occur. Operational instructions belong in existing identity/README.md and operations/vercel.md. Email template guidance distinguishes ZITADEL Message Texts from API-owned text mail; no delivery feature is enabled.

Model-policy exception: the CLI catalog check was unauthenticated; the user explicitly selected "Usar esta sesión", authorizing available session models and tools. The lead owns design/security review and the available delegated worker implements and runs verification. Historical unfinished tasks remain unfinished unless separately evidenced.

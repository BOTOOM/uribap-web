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

- Add onboarding form, API mutation, active-household context, redirect rules, validation/conflict/unavailable states, and responsive/a11y tests.

### Phase 3 — Member and invitation management (User Story 3)

- Add household settings/member list/role controls/invitation forms/acceptance route and permission-driven UI states.

### Phase 4 — Local identity E2E and release gates

- Connect Playwright to the canonical API identity Compose stack, assert PKCE/login/refresh/logout/cookies/Mailpit, regenerate OpenAPI client, run accessibility/responsive/performance/audit/build/Docker gates, and document skipped flows.

## Complexity Tracking

No constitution violations. Auth.js is used as the existing governed BFF boundary. No global client store, browser token storage, duplicate identity provider, or custom OAuth protocol is introduced.

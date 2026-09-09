# Implementation Plan: Web Foundation and Design System

**Branch**: `001-web-foundation-design-system` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification for the Dockerized Next.js frontend foundation and Uribap design system.

## Summary

Create a lightweight Next.js App Router shell with a reusable Uribap token system, accessible
primitives, explicit server/client boundaries, a pinned OpenAPI client seam, representative
loading/empty/error states, reduced-motion behavior, and local/Docker/Vercel-compatible builds.
The feature does not implement OIDC, household onboarding, recipes, inventory, planner logic, or
business calculations.

The planned stack is Next.js 16, React, TypeScript, Tailwind CSS v4, Radix/shadcn primitives,
Phosphor icons, Motion for isolated interaction motion, TanStack Query for future interactive API
cache/mutation boundaries, Zod/React Hook Form for future forms, `openapi-typescript` plus
`openapi-fetch` for the generated client, Vitest/Testing Library, Playwright, and axe checks.
Dependencies will be selected with releases older than seven days and lockfiles.

## Technical Context

**Language/Version**: TypeScript with Node.js 24 LTS-compatible toolchain

**Primary Dependencies**: Next.js 16, React, Tailwind v4, Radix/shadcn, Phosphor icons, Motion,
TanStack Query, Zod, React Hook Form, openapi-typescript, openapi-fetch, Vitest, Testing Library,
Playwright, axe integration

**Storage**: None in the Web foundation; private data comes from the API boundary

**Testing**: ESLint, TypeScript, Vitest/Testing Library, Playwright, axe, responsive checks,
production build, OpenAPI snapshot generation check

**Target Platform**: Vercel production and Docker/Node container for local or alternate hosting

**Project Type**: Authenticated product web application shell

**Performance Goals**: LCP under 2.5s, CLS under 0.1, INP under 200ms on the project test profile;
no unintended horizontal scroll at 375/768/1024/1440px; no unbounded client bundle for shell

**Constraints**: Server Components by default; no domain calculations; Spanish-neutral MVP copy;
no food/product images; WCAG 2.2 AA target; reduced-motion fallback; secure env handling

**Scale/Scope**: Shared shell, token system, primitive state examples, contract client seam and
foundation tests; later feature routes extend this structure

## Constitution Check

- **API source of truth**: PASS. No inventory/forecast/shopping/preparation calculation is in
  scope; the client seam consumes a pinned API contract.
- **Server-first performance**: PASS. Server Components are default and client islands are named.
- **Accessible completion**: PASS. Keyboard, focus, states, responsive widths, axe and reduced
  motion are acceptance gates.
- **Product-specific craft**: PASS. Tokens derive from Open Design without importing its HTML or
  hand-rolled generic controls.
- **Contract/state coverage**: PASS. Snapshot generation and loading/error/permission/stale states
  are explicit requirements.
- **Motion/resource discipline**: PASS. Motion is isolated and purposeful; no GSAP/ReactBits is
  required for foundation.

## Model Assignment

- **Primary**: `gpt-5-6-luna-high` for UI architecture and information hierarchy.
- **Implementation**: `gpt-5-6-sol-high` for Next.js, tokens, generated client and tests.
- **Reviewer**: `gpt-5-6-terra-high` for authentication boundary, accessibility and performance.
- **Artifact analyst**: `glm-5-3-max` for long-context spec/plan/tasks analysis.
- **Routine fixer**: `swe-1-7` for bounded type/lint/test corrections.
- **Escalation**: `gpt-5-6-terra-max` only after explicit critical-risk review; `kimi-k3-max`
  only for unusually large cross-repository artifact review.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-foundation-design-system/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── web-boundary.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx
│   ├── (app)/
│   │   └── layout.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── states/
│   └── shell/
├── features/
│   └── foundation/
├── lib/
│   ├── api/
│   ├── auth/
│   └── config/
└── styles/
    └── tokens.css

contracts/
└── uribap-api.openapi.json

tests/
├── unit/
├── component/
└── accessibility/

e2e/
├── fixtures/
└── foundation.spec.ts

Dockerfile
compose.yml
.dockerignore
.env.example
next.config.ts
package.json
pnpm-lock.yaml
```

**Structure Decision**: Use App Router route groups and feature folders. Shared primitives live
in `components/`; API/auth/config seams live in `lib/`; the foundation feature owns only its
specimen and state examples. No business calculation or backend source is copied into Web.

## Complexity Tracking

No constitution violations. No global client store, image pipeline, animation runtime beyond the
small isolated Motion boundary, or custom stateful primitive is justified by this foundation.

<!--
Sync Impact Report
Version change: template → 1.0.0
Modified principles: none; replaced the generated placeholders with frontend governance.
Added sections: frontend constraints, workflow and model policy.
Removed sections: none; the template placeholders were resolved.
Deferred items: exact dependency versions are selected during foundation after release-age and security checks.
-->
# Uribap Web Constitution

## Core Principles

### I. The API Is the Source of Truth
The frontend MUST consume backend projections and domain decisions. It MUST NOT calculate
inventory balances, projected demand, shortages, shopping quantities, preparation tasks, or
confirmed consumption. Any optimistic preview MUST be clearly marked and reconciled with the
server response before it becomes visible as authoritative state.

### II. Server-First Performance
Next.js Server Components MUST be the default. Client Components MUST be isolated to genuine
interaction, browser APIs, forms, query mutations, and motion. Data requests MUST avoid
waterfalls, duplicate serialization, and unnecessary global state. Private household data MUST
not use a shared cache key that can leak across users or households.

### III. Accessible Task Completion
Every primary user journey MUST be operable with keyboard, visible focus, semantic controls,
and touch targets of at least 44px where practical. Dialogs, menus, tabs, planner slots,
forms, loading states, errors, empty states, conflicts, and success feedback MUST expose
appropriate accessible names and state. `prefers-reduced-motion` MUST disable non-essential
motion without removing information or functionality.

### IV. Product-Specific Visual Craft
The interface MUST preserve the Uribap visual direction: calm household operations, clear
weekly planning, real-versus-projected distinction, explainable impacts, restrained surfaces,
and one coherent token system. The Open Design artifact is inspiration and visual authority,
not source code. Generic card grids, decorative gradients, unexplained motion, emoji icons, and
copy that hides the product consequence chain are not acceptable defaults.

### V. Contract and State Coverage
Every API interaction MUST have explicit loading, empty, error, success, stale/conflict, and
permission behavior where applicable. The generated TypeScript client MUST come from the pinned
backend OpenAPI snapshot. API version or schema changes MUST be reviewed with the API repository
before Web code is updated.

### VI. Testable Interaction and Responsive Behavior
Critical flows MUST have component and end-to-end coverage: authentication, onboarding, recipe
selection, meal replacement, inventory impact, shopping purchase, preparation changes, and
completion reconciliation. Responsive behavior MUST be defined and exercised at 375, 768, 1024,
and 1440px. Accessibility checks MUST be part of the delivery gate.

### VII. Deliberate, Performant Motion
CSS transitions are preferred for frequent interaction feedback. Motion libraries MUST be
loaded only where needed and animate compositor-friendly properties. GSAP or ReactBits MUST
not be added for decoration; a measured interaction need and a reduced-motion fallback are
required. The assistant is a presentation layer over structured backend events and MUST NOT
own business logic.

## Frontend Constraints

- Next.js/React/TypeScript with the App Router is the planned stack.
- Spanish-neutral UI copy is the MVP default; household locale/timezone data comes from the API.
- Auth.js/next-auth with ZITADEL OIDC is the planned BFF boundary. Tokens MUST remain server-side
  in secure cookies and MUST NOT be placed in localStorage or exposed in client props.
- Radix/shadcn primitives, React Hook Form/Zod, generated OpenAPI client, and one icon family
  are preferred over hand-rolled stateful controls.
- Food, product, or recipe imagery MUST NOT be uploaded, stored, or introduced as a required asset.
- SEO is not a product priority, but metadata, error boundaries, and deep links MUST remain valid.
- The frontend MUST be dockerizable even though production deployment targets Vercel.

## Development Workflow and Model Policy

- Each feature MUST follow Spec Kit: constitution → specify → clarify → plan → checklist →
  tasks → analyze → implement → converge.
- Every feature `plan.md` MUST record its primary model, reviewer model, subagent model, and
  escalation condition using identifiers verified by `devin models list --format json`.
- Recommended defaults as of 2026-09-08: `gpt-5-6-luna-high` for product/UI architecture,
  `gpt-5-3-codex-high` for implementation, `claude-opus-5-high` for auth/accessibility and
  final review, and `swe-1-7` for bounded test/type fixes. Adaptive MAY be used for mixed low-risk work.
- Model selection is a tool policy, not a runtime dependency. If a model is unavailable, the
  work MUST stop for reassignment rather than silently weakening a critical review.
- A pull request MUST identify changed routes/components, API contract impact, accessibility
  states, performance impact, and test coverage. Commits MUST be in English and focused.

## Governance

This constitution is the highest-priority project governance document for `uribap-web`.
Spec, plan, task, code, and review artifacts MUST comply with its MUST statements. Amendments
require a dated Sync Impact Report, a semantic version bump, and review of affected specs/tasks.
A major version changes or removes a principle; a minor version adds a principle or materially
expands governance; a patch version clarifies wording without changing obligations. Any
constitution conflict found by analysis is blocking until resolved explicitly.

**Version**: 1.0.0 | **Ratified**: 2026-09-08 | **Last Amended**: 2026-09-08

# Uribap Web Engineering Guide

## Scope

This repository owns the Next.js frontend, design system, BFF session boundary, generated API
client, accessibility, responsive behavior, E2E tests, and Vercel/Docker delivery for Uribap.

## Required workflow

- Read `.specify/memory/constitution.md` and the active feature artifacts before changing code.
- Follow Spec Kit in order: specify, clarify, plan, checklist, tasks, analyze, implement, converge.
- Every roadmap item MUST have its own complete feature spec, plan, design/contracts when relevant,
  tasks, tests, analyze result, implementation, and convergence before it is considered done.
- No product code may start before the active spec/plan/tasks/analyze gate is complete, and no task
  may be closed without its documented tests and quickstart validation.
- Treat FastAPI responses as authoritative; never reimplement inventory, forecasting, shopping, or
  preparation calculations in React.
- Prefer Server Components and isolate client state to interactive leaves.
- Implement loading, empty, error, success, stale/conflict, permission, keyboard, mobile, and
  reduced-motion states for relevant flows.
- Never log or commit credentials, tokens, personal data beyond what the feature requires, or food
  images.

## Verification

Expected checks will be documented in the active feature plan. Foundation targets include lint,
TypeScript, unit/component tests, Playwright, accessibility checks, production build, OpenAPI
snapshot verification, and Docker health checks.

## Reusable testing skills

- Use `/uribap-web-testing` before closing any Web feature; it runs component, API-state, E2E,
  accessibility, responsive, audit, and performance gates without editing code.
- Use `/uribap-local-identity-testing` for OIDC/household features. Local complete email flows use
  Docker Compose with ZITADEL, dedicated PostgreSQL, and Mailpit; Brevo is never used locally.

## Model guidance

Use the model matrix in the active `specs/*/plan.md`. As of 2026-09-10, prefer
`gpt-5-6-luna-high` for UI architecture, `gpt-5-6-sol-high` for implementation,
`gpt-5-6-terra-high` for auth/accessibility review, `glm-5-3-max` for long-context
analysis, `kimi-k3-max` only for explicit cross-repo escalation, and `swe-2-high` for bounded fixes.

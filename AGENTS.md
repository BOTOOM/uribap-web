# Uribap Web Engineering Guide

## Scope

This repository owns the Next.js frontend, design system, BFF session boundary, generated API
client, accessibility, responsive behavior, E2E tests, and Vercel/Docker delivery for Uribap.

## Required workflow

- Read `.specify/memory/constitution.md` and the active feature artifacts before changing code.
- Follow Spec Kit in order: specify, clarify, plan, checklist, tasks, analyze, implement, converge.
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

## Model guidance

Use the model matrix in the active `specs/*/plan.md`. As of 2026-09-08, prefer
`gpt-5-6-luna-high` for UI architecture, `gpt-5-6-sol-high` for implementation,
`gpt-5-6-terra-high` for auth/accessibility review, `glm-5-3-max` for long-context
analysis, `kimi-k3-max` only for explicit cross-repo escalation, and `swe-1-7` for bounded fixes.

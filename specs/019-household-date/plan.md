# Implementation Plan: Household-local dashboard date

**Branch**: `devin/1791400891-household-date` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-household-date/spec.md`

## Summary

Make the server-rendered home resolve the active household and use its IANA time zone to derive today, tomorrow, and the current weekly request window. Reuse the existing date helper and preserve UTC as a resilient fallback. Extract the date-window calculation into a testable module so the Colombia/UTC boundary has deterministic regression coverage.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Next.js 16.1

**Primary Dependencies**: Next.js App Router, Auth.js, existing server API client, `Intl.DateTimeFormat`

**Storage**: N/A; reads the existing household time-zone field

**Testing**: Vitest unit tests, TypeScript, ESLint, Next.js production build

**Target Platform**: Server-rendered responsive web application on Vercel/Docker

**Project Type**: Next.js web application

**Performance Goals**: Add no client JavaScript and no serialized private household metadata

**Constraints**: Server Components by default; API remains source of truth; household lookup failure must not fail the dashboard

**Scale/Scope**: One home route, one shared server date-window helper, focused unit coverage

**Primary model**: `gpt-5-6-sol-high`

**Reviewer model**: `gpt-5-6-terra-high`

**Subagent model**: `swe-2-high` for bounded test/type fixes

**Escalation condition**: Cross-repository API contract changes or ambiguous household-selection behavior

## Constitution Check

- **API source of truth**: Pass. The frontend reads the household's stored time zone and does not reproduce domain calculations.
- **Server-first performance**: Pass. Date resolution stays server-side and introduces no client component or browser state.
- **Accessible task completion**: Pass. No interaction or semantic markup changes.
- **Product-specific visual craft**: Pass. Existing home presentation remains unchanged.
- **Contract and state coverage**: Pass. Uses existing account and household read operations, with explicit fallback behavior.
- **Testable responsive behavior**: Pass. The boundary calculation receives deterministic unit coverage; no responsive layout changes.
- **Deliberate motion**: Pass. No motion changes.

Post-design re-check: all gates remain satisfied; no constitution exception is required.

## Project Structure

### Documentation

```text
specs/019-household-date/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dashboard-date-window.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/
├── app/(app)/page.tsx
└── lib/dashboard/date-window.ts

tests/
└── unit/dashboard-date-window.test.ts
```

**Structure Decision**: Keep the home as a Server Component, place reusable server-compatible calendar logic under `src/lib/dashboard`, and cover the pure calculation with a focused unit test.

## Complexity Tracking

No constitution violations or additional complexity.

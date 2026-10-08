# Implementation Plan: Browser-local dashboard date

**Branch**: `devin/1791400891-household-date` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-household-date/spec.md`

## Summary

Make the server-rendered home prefer the validated browser time zone carried in the `uribap_tz` cookie, then fall back to the active household time zone and UTC. Derive today, tomorrow, the plan week, and forecast window from one date. On first visit, render with the household zone when available; a small client leaf writes the browser zone and refreshes only when it differs. Reuse the existing date-window helper unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Next.js 16.1

**Primary Dependencies**: Next.js App Router, Auth.js, existing server API client, `Intl.DateTimeFormat`

**Storage**: Non-HttpOnly `uribap_tz` browser cookie; existing household time-zone field remains the fallback

**Testing**: Vitest unit/component tests, TypeScript, ESLint, Next.js production build

**Target Platform**: Server-rendered responsive web application on Vercel/Docker

**Project Type**: Next.js web application

**Performance Goals**: Add only a small client leaf for browser-zone synchronization; skip the household time-zone lookup when a valid cookie exists and serialize no private household metadata

**Constraints**: Server Components by default; use the async Next.js `cookies()` request API; the client cookie is readable by browser JavaScript; household lookup failure must not fail the dashboard

**Scale/Scope**: Home and AppShell, one shared date-window helper, one browser-sync leaf, focused unit and component coverage

**Primary model**: `gpt-5-6-sol-high`

**Reviewer model**: `gpt-5-6-terra-high`

**Subagent model**: `swe-2-high` for bounded test/type fixes

**Escalation condition**: Cross-repository API contract changes or ambiguous household-selection behavior

## Constitution Check

- **Date authority**: Pass. A valid browser cookie wins; the household time zone and UTC remain ordered fallbacks.
- **Server-first performance**: Pass. Date selection is server-side; the isolated client leaf only reads the browser zone, updates its cookie, and refreshes on change.
- **Accessible task completion**: Pass. No interaction or semantic markup changes.
- **Product-specific visual craft**: Pass. Existing home presentation remains unchanged.
- **Contract and state coverage**: Pass. Uses request cookies and the existing account/household reads, with explicit first-visit and fallback behavior.
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
├── components/shell/
│   ├── AppShell.tsx
│   └── BrowserTimeZoneSync.tsx
└── lib/
    ├── dashboard/date-window.ts
    └── time-zone.ts

tests/
├── component/browser-time-zone-sync.test.tsx
└── unit/
    ├── dashboard-date-window.test.ts
    └── time-zone.test.ts
```

**Structure Decision**: Keep the home and AppShell as Server Components, isolate browser APIs in one client leaf, share time-zone validation under `src/lib`, leave `dashboardDateWindow` unchanged, and cover behavior with focused unit and component tests.

## Complexity Tracking

No constitution violations or additional complexity.

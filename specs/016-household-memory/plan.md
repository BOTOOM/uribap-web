# Implementation Plan: Household Memory Settings

**Branch**: `devin/1790823174-household-memory` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

## Summary

Sync API feature 018’s pinned OpenAPI snapshot and generated types, expose its household-scoped profile and memory/diner mutations through authenticated BFF routes, then add a server-rendered “Memoria” settings page with small client leaves for memory and diner interactions. The UI displays profile data without duplicating API semantics, uses API versions for optimistic updates, and refreshes server state after mutations.

## Technical Context

**Language/Version**: TypeScript 5, React, Next.js 16 App Router
**Primary Dependencies**: Next.js, React, generated `openapi-typescript` schema, Vitest, Testing Library, Playwright
**Storage**: API feature 018; no Web persistence
**Testing**: Vitest component/unit/accessibility tests, authenticated opt-in Playwright E2E, lint, typecheck, build
**Target Platform**: Responsive web application
**Project Type**: Next.js frontend with authenticated BFF
**Performance Goals**: Render the server-loaded profile without introducing a second client-side profile request; use one BFF operation per mutation.
**Constraints**: Do not change the API repository; use `serverHouseholdFetch`; do not expose session credentials or log memory content; generated API files must come from the repository generator.
**Scale/Scope**: One settings route, seven BFF handler methods across five route files, memory/diner interaction leaves, shell/mobile navigation, focused tests, and an uncommitted preview.

## Constitution Check

- **API authority — PASS**: Profile, diner, memory, validation, and concurrency semantics remain API-owned; the Web formats and submits data only.
- **Server/client boundary — PASS**: The Server Component loads the profile and active members; only interactive forms and controls are client components.
- **Authenticated BFF — PASS**: All browser mutations go through BFF handlers backed by `serverHouseholdFetch`; household selection remains server-side.
- **Accessibility/responsive — PASS**: Semantic controls, keyboard operation, visible focus, practical 44px touch targets, announced status/errors, visible text labels for restrictions, all four required viewport widths, and reduced-motion behavior are in the plan and test tasks.
- **Privacy — PASS**: Memory content is rendered for the authenticated household only and is never logged.
- **Verification — PASS**: The required Web lint, typecheck, test, API sync, and production build gates are listed below.

## Model Assignment

- UI architecture: `gpt-5-6-luna-high`.
- Implementation: `gpt-5-6-sol-high`.
- Accessibility/security review: `gpt-5-6-terra-high`.
- Long-context analysis: `glm-5-3-max`.
- Bounded fixes: `swe-2-high`.
- **Accepted exception**: Model IDs follow the Web `AGENTS.md` matrix; `devin models list` is unavailable in this environment. This is the same lead-approved, documented exception used by feature 014; live model verification is not claimed.

## Clarification

The authoritative design specifies the page copy, operations, validation limits, stale-state behavior, preview, and verification. No material UX or scope questions remain. The lead confirmed the pinned API JSON snapshot includes the memory collection operations; its operations and DTOs were parsed as JSON before planning.

## API Contract Sequence

Use API branch `devin/1790821649-household-memory` at `ef792f4909e0960133441b13308aa3ee699b87b6`. Copy `openapi/openapi.json` to `contracts/uribap-api.openapi.json`, regenerate `src/lib/api/generated/schema.ts` with `pnpm api:generate`, and update `contracts/metadata.json` and `tests/unit/api-contract.test.ts` to the API revision, schema `v14`, and date `2026-10-05`. The Web-local pin advances from the existing `v13`; the upstream OpenAPI `info.version` remains `0.1.0` and is a separate value. Never hand-edit generated types. The API branch is the contract source; do not edit the API repository. The local `pnpm api:check` verifies this snapshot; CI comparison against API `main` may differ until the API feature merges.

The API also defines `GET /diners` and `GET /memories`; this page uses the complete `GET /memory/profile` response instead of separate collection reads. The parsed operations are `GET /memory/profile`, `POST /diners`, `PATCH/DELETE /diners/{diner_id}`, `POST /memories`, and `PATCH/DELETE /memories/{memory_id}`. Creates return 201 with response DTOs and accept `Idempotency-Key`; PATCH returns 200 and requires `expected_version`; DELETE returns 204. Problem responses include 401, 403, 404, 409, and 422. The UI reads the profile’s household and diner memories rather than issuing additional list requests.

## Architecture

### Server-loaded profile and members

Add `src/app/(app)/settings/memoria/page.tsx` as a Server Component. Follow the active-membership and household-fetch pattern used by settings pages. Fetch `/memory/profile` with `serverHouseholdFetch` and load the active household’s members server-side for the optional diner link selector. Filter out members already linked to a diner before passing choices to the client. Render a useful permission/load error rather than a blank page.

### BFF routes

Add these handlers and forward through `serverHouseholdFetch`:

- `src/app/api/memory/profile/route.ts`: GET `/memory/profile`.
- `src/app/api/diners/route.ts`: POST `/diners`.
- `src/app/api/diners/[dinerId]/route.ts`: PATCH and DELETE `/diners/{diner_id}`.
- `src/app/api/memories/route.ts`: POST `/memories`.
- `src/app/api/memories/[memoryId]/route.ts`: PATCH and DELETE `/memories/{memory_id}`.

POST handlers forward JSON and the `Idempotency-Key` header. PATCH handlers forward the JSON body, including `expected_version`. Preserve upstream status and problem details; 204 handlers return an empty 204 response. Do not add a direct browser-to-API call.

### Interactive memory and diner controls

Keep the page’s profile display server-rendered. Isolate editing/add forms, forget/archive confirmation, pending states, and mutation fetches in small client leaves under `src/components/memory/`. The client sends requests only to the same-origin BFF. Generate a new `crypto.randomUUID()` idempotency key for each memory or diner POST submission. Use `router.refresh()` after successful mutations and after 404/409 stale-state responses.

Group memory content by API kind and display the exact labels and order in the spec. Each memory editor changes content and kind and submits `expected_version`. Keep field-level 422 messages, permission errors, pending controls, a 409 conflict announcement, and a 404 gone-record announcement visible. Confirm destructive “Olvidar” and archive actions using existing confirmation patterns. The archive prompt explicitly states that archived diner memories stop being used.

### Navigation and styling

Show “Memoria del hogar” as the page heading, then add “Memoria” adjacent to “Hogar”/“Agentes” in `ShellNav.tsx` and `MobileNav.tsx`’s `MORE_HREFS`; use an existing icon. Add memory styles using existing surface, muted, accent, and danger tokens. Keep restriction emphasis textual as well as visual. Support stacked cards/forms at mobile widths, visible focus, 44px touch targets where practical, and reduced motion.

### Preview

Add `src/app/dev-preview/memory/page.tsx` with the household note “Comemos para dos; el agua es del filtro, no se compra”, linked diner “Edwar”, and diner “Pareja” with a restriction and likes. Keep every dev-preview file uncommitted. Reuse the existing `pnpm dev` process on port 3000 and capture `/home/ubuntu/work/memory-375.png` and `/home/ubuntu/work/memory-1440.png`.

## Test Plan

- Pure grouping/order tests for household and diner memory kinds and textual restriction treatment.
- Memory component tests for household/diner rendering, idempotency header, expected-version body, 409 conflict + refresh, 404 gone state, field validation, and forget confirmation.
- Diner form tests for 80-character validation, available-member filtering, rename version, and archive confirmation/copy.
- BFF route tests for method/path forwarding, JSON and `Idempotency-Key`, preserved API statuses/problem detail, and 204 responses.
- Accessibility checks in `tests/accessibility/` for semantic labels, visible focus, keyboard-operable forms/confirmations, announced results, and restriction text. Use the repository’s existing Testing Library accessibility pattern; the Playwright axe setup is available for browser E2E.
- Add an authenticated opt-in `e2e/memory.spec.ts` following the existing gated plan/onboarding pattern. It selects “Memoria”, checks household and diner content, exercises a memory add/forget journey, and asserts no horizontal overflow at 375px, 768px, 1024px, and 1440px. It remains skipped unless `RUN_MEMORY_E2E=1` and an authenticated local stack are available.
- Preview check at 375px, 768px, 1024px, and 1440px; verify `/dev-preview/memory` renders and no horizontal overflow, capturing the requested 375px and 1440px screenshots.

## Verification

Run in order:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm api:check
pnpm build
git diff --check
```

Also run the feature’s focused component/unit/BFF/accessibility tests before those gates. Keep the dev server on port 3000 running and the preview files uncommitted. Commit and push Part B to this branch; do not wait for CI.

## Project Structure

```text
specs/016-household-memory/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
├── checklists/
├── tasks.md
├── analyze.md
└── converge.md

src/app/(app)/settings/memoria/page.tsx
src/app/api/memory/profile/route.ts
src/app/api/diners/route.ts
src/app/api/diners/[dinerId]/route.ts
src/app/api/memories/route.ts
src/app/api/memories/[memoryId]/route.ts
src/components/memory/
tests/component/memory/
tests/unit/memory/
tests/accessibility/memory.a11y.test.tsx
e2e/memory.spec.ts
```

**Structure Decision**: Extend the existing Next.js App Router, BFF, shell, and testing layout; do not introduce a new package or persistence layer.

## Complexity Tracking

No constitution violations or new infrastructure are required.

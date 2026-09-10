# Research: Web Foundation and Design System

## Decision 1: Next.js rendering model

- **Decision**: Use Next.js 16 App Router with Server Components by default and Client Components
  only for browser interaction, forms, queries, or motion.
- **Rationale**: This minimizes shipped JavaScript and keeps private API data server-controlled.
  It also matches the Next.js and Vercel guidance loaded for the project.
- **Alternatives considered**: Marking entire routes `use client`, a separate SPA, or a global
  client store. Rejected for bundle size, privacy, and hydration risk.

## Decision 2: UI foundation

- **Decision**: Use Tailwind v4 tokens plus owned shadcn/Radix-based primitives, Phosphor icons,
  and Motion only in isolated leaves.
- **Rationale**: Uribap needs a distinctive visual system rather than an unmodified component
  theme, while stateful controls still need maintained accessibility behavior.
- **Alternatives considered**: Mixing multiple component systems, hand-rolling dialogs/menus, or
  adding ReactBits broadly. Rejected because they increase inconsistency and accessibility/perf risk.

## Decision 3: API client boundary

- **Decision**: Keep a pinned OpenAPI snapshot in Web and generate TypeScript types/client with
  `openapi-typescript` and `openapi-fetch`. CI compares generated output to the snapshot.
- **Rationale**: Public repos need explicit compatibility and no duplicated DTO definitions.
- **Alternatives considered**: Hand-written fetch wrappers/types, GraphQL, or importing backend
  source. Rejected for drift and repository coupling.

## Decision 4: State and data behavior

- **Decision**: Use server data for initial shell and future route reads; reserve TanStack Query
  for interactive mutations and cache invalidation after the API contract is ready. Model all
  request states explicitly.
- **Rationale**: This avoids a large global store while supporting planner/inventory mutation
  flows later.
- **Alternatives considered**: Redux/global Zustand for all server data or useEffect-only fetching.
  Rejected for unnecessary client state and request waterfalls.

## Decision 5: Visual direction and motion

- **Decision**: Derive semantic tokens and layout rules from `mesa-household-app.html`: calm
  light surfaces, green accent, editorial hierarchy, tabular quantities, explicit impact chain,
  desktop sidebar/mobile bottom navigation, and restrained motion. No image dependency.
- **Rationale**: It is the approved product-specific reference and supports an operate/task mode.
- **Alternatives considered**: Generated pink romance palette, industrial dashboard theme, generic
  dark gradients, or copying the HTML. Rejected as visually mismatched or non-maintainable.

## Decision 6: Model routing

- **Decision**: Luna designs, Sol builds, Terra reviews, GLM-5.3 analyzes long artifacts, and
  SWE-2 handles bounded fixes at no model cost. Kimi K3 is opt-in only for unusually large cross-repo review.
- **Rationale**: This follows the approved project matrix and separates authorship/review cost.
- **Alternatives considered**: Using one premium model for every task. Rejected because it raises
  cost without improving routine work.

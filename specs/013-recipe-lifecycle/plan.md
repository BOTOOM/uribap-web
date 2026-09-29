# Implementation Plan: Recipe Lifecycle Web Controls

**Branch**: `013-recipe-lifecycle` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

## Summary

Expose the API's recipe metadata edit, revision, archive, and restore operations through small client controls backed by authenticated Next.js Route Handlers. Keep recipe pages Server Components and derive archived state from the API response.

## Constraints

Next.js 16 App Router, generated OpenAPI types, server-only authenticated BFF, React client leaves for dialogs and mutations, Radix Dialog accessibility, API-authoritative lifecycle behavior, and the existing visual system. Do not add colors or emoji. Preserve read-only recipe history and meal references.

## Model Assignment

Primary `gpt-5-6-luna-high`, implementation `gpt-5-6-sol-high`, reviewer `gpt-5-6-terra-high`, analysis `glm-5-3-max`, bounded fixes `swe-2-high`.

Model IDs taken from the AGENTS.md matrix (2026-09-10); devin models list unavailable in this environment.

## Structure

```text
contracts/uribap-api.openapi.json
contracts/metadata.json
src/lib/api/generated/schema.ts
src/app/api/recipes/[recipeId]/route.ts
src/app/api/recipes/[recipeId]/revisions/route.ts
src/app/api/recipes/[recipeId]/archive/route.ts
src/app/api/recipes/[recipeId]/unarchive/route.ts
src/components/recipes/RecipeEditDialog.tsx
src/components/recipes/RecipeArchiveButton.tsx
src/components/recipes/NewVersionButton.tsx
src/app/(app)/recetas/page.tsx
src/app/(app)/recetas/[recipeId]/page.tsx
tests/component/recipes/
```

## Verification Gates

Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm api:check`, and `pnpm build`. The API contract compatibility workflow compares the pinned snapshot with API `main`; it is expected to report a mismatch until API PR #149 merges and must not be worked around. After pushing, leave the local authenticated API and Web review environment running.

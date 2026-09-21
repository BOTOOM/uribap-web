# Implementation Plan: Recipes and Ingredients Web Experience

**Branch**: `003-recipes-ingredients` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

## Summary

Add the first domain Web routes for recipe and ingredient browsing/editing. Server Components load API-authoritative lists/details through the BFF; client components own only search controls, forms, dialogs, and optimistic UI states. Generated OpenAPI types remain the only API contract.

## Constraints

Next.js 16 App Router, Auth.js BFF from 002, Server Components by default, Zod/React Hook Form for forms, no business calculations, no images/nutrition/email/deployment.

## Model Assignment

Primary `gpt-5-6-luna-high`, implementation `gpt-5-6-sol-high`, reviewer `gpt-5-6-terra-high`, analysis `glm-5-3-max`, bounded fixes `swe-2-high`.

## Structure

```text
src/app/(app)/recetas/page.tsx
src/app/(app)/recetas/[recipeId]/page.tsx
src/app/(app)/recetas/nueva/page.tsx
src/app/(app)/ingredientes/page.tsx
src/components/recipes/
src/components/ingredients/
src/features/recipes/
src/features/ingredients/
src/app/api/recipes/
src/app/api/ingredients/
e2e/recipes.spec.ts
tests/component/recipes/
tests/component/ingredients/
```

## Gates

UV/API OpenAPI snapshot first; then Web lint/typecheck/Vitest/Playwright/axe/responsive/build/audit/performance. Email and deployment remain out of scope.

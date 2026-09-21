# Feature Specification: Recipes and Ingredients Web Experience

**Feature Branch**: `003-recipes-ingredients`
**Created**: 2026-09-21
**Status**: Ready for implementation

## User Stories

### US1 - Browse ingredients and recipes (P1)

A household member can search authorized ingredients and recipes, filter by meal type/tag, paginate results, and distinguish archived records.

### US2 - Create and edit recipe versions (P1)

An owner/admin/member with permission can create a draft recipe, edit ingredients/instructions, publish a version, and see that published history is immutable.

### US3 - Favorite and prepare recipe selection (P2)

A member can favorite recipes and open a recipe detail view showing quantities, servings, instructions, meal types, and preparation rules without Web-side calculations.

## Requirements

- Web MUST consume the generated API contract and never calculate unit conversion or recipe demand.
- Web MUST render loading, empty, error, forbidden, stale/conflict, archived, and success states.
- Forms MUST validate ergonomically with Zod/React Hook Form while treating API responses as authoritative.
- Recipe version edits MUST use server-only BFF routes and preserve immutable published versions.
- Search/filter interactions MUST be keyboard accessible and responsive at 375/768/1024/1440px.
- No food images, nutrition UI, external email, or deployment work is in scope.

## Success Criteria

- 100% of recipe/ingredient client calls use generated types.
- No React code contains unit/demand calculations.
- Browse/create/publish/favorite flows have component and Playwright coverage.
- Accessibility and responsive gates pass at required viewports.
- API snapshot/client check is deterministic.

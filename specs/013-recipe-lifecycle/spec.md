# Feature Specification: Recipe Lifecycle Web Controls

**Feature Branch**: `013-recipe-lifecycle`
**Created**: 2026-09-29
**Status**: Ready for implementation

## User Stories

### US1 - Edit recipe metadata and versions (P1)

A household member can update a recipe's name or description without creating a version. Changing servings or preparation time updates a draft in place or creates and publishes the next version when the current recipe is published, preserving its ingredient lines and history.

### US2 - Archive and restore recipes (P1)

A household member can archive an active recipe after reviewing what archiving means and restore an archived recipe later. Archived recipes remain readable, retain their historical meal references, and are excluded from the planner and default recipe list.

### US3 - Create a draft from the current recipe (P2)

A household member can create a draft revision that starts with the current ingredient lines.

## Requirements

- The generated API contract is the source of truth; Web code MUST NOT implement recipe/version business rules.
- All lifecycle writes MUST use authenticated server-only BFF routes and forward API errors without exposing access tokens.
- Metadata-only edits MUST call `PATCH /recipes/{id}`; clearing a description MUST send `null`.
- Servings or preparation-time edits MUST call `POST /recipes/{id}/revisions` with `publish` matching the latest state; combined metadata and version changes call both endpoints.
- Creating a new draft MUST call the revisions endpoint with `publish: false`, allowing the API to clone the current ingredients.
- Archiving MUST require confirmation with the specified history explanation; restoring MUST be available for archived recipes.
- Archived recipes MUST display a notice and remain read-only. Edit, publish, new-version, and ingredient-edit controls MUST be hidden; restore MUST remain available.
- The “Archivadas” filter MUST request `archived=true`; other filters use the default active recipe list. Archived status is derived from `archived_at`, not `latest_state`.
- Dialogs MUST use Radix primitives, preserve keyboard/focus behavior, show failures through an alert, and close with a toast and refresh after success.
- The UI MUST retain existing design tokens/classes and remain usable without horizontal overflow at 375, 768, 1024, and 1440 pixels, with touch targets of at least 44px.

## Success Criteria

- The generated client includes the lifecycle endpoints from API revision `acc8c684e930ac62dee26fe0ce053e317f1d1a52`.
- Component tests cover metadata-only edits, published and draft revisions, combined changes, errors, archive confirmation, restore, and cloned draft creation.
- Existing lint, typecheck, component tests, API contract generation check, and production build pass.
- The local authenticated visual-review environment contains published, draft, and archived recipes.

## Out of Scope

- Editing recipe ingredients from this lifecycle dialog.
- Web-side version numbering, ingredient cloning, authorization, or meal-history calculations.
- Changes to API behavior, CI contract comparison policy, or production deployment.
